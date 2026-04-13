import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Find or create user (with email fallback)
    let dbUser;
    try {
      dbUser = await db.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        const existingByEmail = await db.user.findUnique({ where: { email: user.email! } });
        if (existingByEmail) {
          dbUser = existingByEmail;
        } else {
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
      }
    } catch (dbError: any) {
      console.error('DB user error:', dbError?.message);
      return NextResponse.json({ 
        error: 'خطأ في الاتصال بقاعدة البيانات',
        dbError: dbError?.message,
      }, { status: 500 });
    }

    // Date range for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // ✅ RUN ALL QUERIES IN PARALLEL — this is the key optimization
    const [
      todayCheckIn,
      recentCheckIns,
      totalCheckIns,
      cleanDays,
      relapsedDays,
      journalCount,
    ] = await Promise.all([
      db.checkIn.findFirst({
        where: { userId: dbUser.id, date: { gte: startOfDay, lt: endOfDay } },
      }),
      db.checkIn.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      db.checkIn.count({ where: { userId: dbUser.id } }),
      db.checkIn.count({ where: { userId: dbUser.id, relapsed: false } }),
      db.checkIn.count({ where: { userId: dbUser.id, relapsed: true } }),
      db.dailyJournal.count({ where: { userId: dbUser.id } }).catch(() => 0),
    ]);

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
  } catch (error: any) {
    console.error('Stats error:', error?.message);
    return NextResponse.json({ 
      error: 'حدث خطأ في الخادم',
      message: error?.message,
    }, { status: 500 });
  }
}
