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

    let dbUser;
    try {
      dbUser = await db.user.findUnique({ where: { id: user.id } });
    } catch (dbFindError: any) {
      console.error('DB find user error:', dbFindError?.message);
      return NextResponse.json({ 
        error: 'خطأ في الاتصال بقاعدة البيانات',
        hint: 'Check if DATABASE_URL is set and migrations have been run',
        dbError: dbFindError?.message,
      }, { status: 500 });
    }
    
    if (!dbUser) {
      try {
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
      } catch (dbCreateError: any) {
        console.error('DB create user error:', dbCreateError?.message);
        return NextResponse.json({ 
          error: 'خطأ في إنشاء المستخدم',
          dbError: dbCreateError?.message,
        }, { status: 500 });
      }
    }

    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    let todayCheckIn = null;
    try {
      todayCheckIn = await db.checkIn.findFirst({
        where: { 
          userId: dbUser.id, 
          date: { gte: startOfDay, lt: endOfDay },
        },
      });
    } catch (checkInError: any) {
      console.error('CheckIn query error:', checkInError?.message);
      // Continue without todayCheckIn rather than crashing
    }

    let recentCheckIns: any[] = [];
    let totalCheckIns = 0;
    let cleanDays = 0;
    let relapsedDays = 0;
    let journalCount = 0;

    try {
      recentCheckIns = await db.checkIn.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: 'desc' },
        take: 10,
      });

      totalCheckIns = await db.checkIn.count({ where: { userId: dbUser.id } });
      cleanDays = await db.checkIn.count({ where: { userId: dbUser.id, relapsed: false } });
      relapsedDays = await db.checkIn.count({ where: { userId: dbUser.id, relapsed: true } });
    } catch (statsError: any) {
      console.error('Stats query error:', statsError?.message);
    }

    try {
      journalCount = await db.dailyJournal.count({ where: { userId: dbUser.id } });
    } catch {
      journalCount = 0;
    }

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
      stack: error?.stack?.split('\n').slice(0, 3),
    }, { status: 500 });
  }
}