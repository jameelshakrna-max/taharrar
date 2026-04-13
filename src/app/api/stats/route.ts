import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Step 1: Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Step 2: Find or create user using upsert by email
    // We use email as the unique key because the Supabase auth ID
    // might not match an existing Prisma user ID
    let dbUser;
    try {
      // First try to find by ID (ideal case)
      dbUser = await db.user.findUnique({ where: { id: user.id } });
      
      if (!dbUser) {
        // Not found by ID — try by email, or create new
        dbUser = await db.user.upsert({
          where: { email: user.email! },
          update: {
            // Update the ID if it changed (e.g., user was deleted and re-created in Supabase)
            id: user.id,
          },
          create: {
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
    } catch (dbError: any) {
      console.error('DB user error:', dbError?.message);
      return NextResponse.json({ 
        error: 'خطأ في الاتصال بقاعدة البيانات',
        dbError: dbError?.message,
      }, { status: 500 });
    }

    // Step 3: Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Step 4: Get today's check-in
    const todayCheckIn = await db.checkIn.findFirst({
      where: { 
        userId: dbUser.id, 
        date: { gte: startOfDay, lt: endOfDay },
      },
    });

    // Step 5: Get all stats
    let recentCheckIns: Awaited<ReturnType<typeof db.checkIn.findMany>> = [];
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

    // Step 6: Return all data
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
