import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const supabase = createClient();
    
    // 1. CHECK THE TOKEN
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // 2. FIND OR CREATE USER IN PRISMA USING THEIR SECURE ID
    let dbUser = await db.user.findUnique({ where: { id: user.id } });
    
    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          id: user.id,
          email: user.email!,
          streakDays: 0,
          bestStreak: 0,
          goalStreak: 30,
          streakFreezesLeft: 1,
          preferredTheme: 'dark',
          reminderEnabled: false,
          reminderTime: '21:00',
        },
      });
    }

    // 3. GET STATS (Notice we use dbUser.id now, NOT email!)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIn = await db.checkIn.findFirst({
      where: { userId: dbUser.id, date: { gte: today, lt: tomorrow } },
    });

    const recentCheckIns = await db.checkIn.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const totalCheckIns = await db.checkIn.count({ where: { userId: dbUser.id } });
    const cleanDays = await db.checkIn.count({ where: { userId: dbUser.id, relapsed: false } });
    const relapsedDays = await db.checkIn.count({ where: { userId: dbUser.id, relapsed: true } });
    const journalCount = await db.dailyJournal.count({ where: { userId: dbUser.id } });

    // ... (Keep the rest of your weekly/monthly stats calculation here exactly as it was, 
    // just make sure all db.checkIn.findMany use `where: { userId: dbUser.id }` instead of email)

    return NextResponse.json({
      user: dbUser,
      todayCheckedIn: !!todayCheckIn,
      todayRelapsed: todayCheckIn?.relapsed || false,
      todayMood: todayCheckIn?.mood || null,
      todayNote: todayCheckIn?.note || null,
      recentCheckIns,
      totalCheckIns,
      cleanDays,
      relapsedDays,
      weeklyStats: [],
      monthlyStats: [],
      relapseByDay: [],
      journalCount,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}