import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Check if user has already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIn = await db.checkIn.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get recent check-ins (last 10)
    const recentCheckIns = await db.checkIn.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 10,
    });

    // Get all check-ins for stats calculations
    const allCheckIns = await db.checkIn.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    });

    const totalCheckIns = allCheckIns.length;
    const cleanDays = allCheckIns.filter((ci) => !ci.relapsed).length;
    const relapsedDays = allCheckIns.filter((ci) => ci.relapsed).length;

    // Weekly stats (last 8 weeks)
    const weeklyStats: { weekLabel: string; checkIns: number; clean: number; relapsed: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (w * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekCheckIns = allCheckIns.filter(
        (ci) => {
          const d = new Date(ci.date);
          return d >= weekStart && d < weekEnd;
        }
      );

      weeklyStats.push({
        weekLabel: `أسبوع ${8 - w}`,
        checkIns: weekCheckIns.length,
        clean: weekCheckIns.filter((ci) => !ci.relapsed).length,
        relapsed: weekCheckIns.filter((ci) => ci.relapsed).length,
      });
    }

    // Monthly stats (last 6 months)
    const monthlyStats: { monthLabel: string; checkIns: number; clean: number; relapsed: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - m + 1, 1);

      const monthCheckIns = allCheckIns.filter(
        (ci) => {
          const d = new Date(ci.date);
          return d >= monthDate && d < monthEnd;
        }
      );

      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      monthlyStats.push({
        monthLabel: monthNames[monthDate.getMonth()],
        checkIns: monthCheckIns.length,
        clean: monthCheckIns.filter((ci) => !ci.relapsed).length,
        relapsed: monthCheckIns.filter((ci) => ci.relapsed).length,
      });
    }

    // Relapse pattern: day of week distribution
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const relapseByDay: { day: string; count: number }[] = arabicDays.map((day) => ({
      day,
      count: 0,
    }));

    for (const ci of allCheckIns) {
      if (ci.relapsed) {
        const d = new Date(ci.date);
        relapseByDay[d.getDay()].count++;
      }
    }

    // Freeze status
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const freezeUsedThisWeek = user.lastFreezeUsedAt
      ? new Date(user.lastFreezeUsedAt) >= monday
      : false;

    // Journal count
    const journalCount = await db.dailyJournal.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        streakDays: user.streakDays,
        bestStreak: user.bestStreak,
        goalStreak: user.goalStreak,
        streakFreezesLeft: user.streakFreezesLeft,
        freezeUsedThisWeek,
      },
      todayCheckedIn: !!todayCheckIn,
      todayRelapsed: todayCheckIn?.relapsed ?? false,
      todayMood: todayCheckIn?.mood ?? null,
      todayNote: todayCheckIn?.note ?? null,
      recentCheckIns: recentCheckIns.map((ci) => ({
        id: ci.id,
        date: ci.date.toISOString(),
        relapsed: ci.relapsed,
        mood: ci.mood,
        note: ci.note,
      })),
      // Enhanced stats
      totalCheckIns,
      cleanDays,
      relapsedDays,
      weeklyStats,
      monthlyStats,
      relapseByDay,
      journalCount,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
