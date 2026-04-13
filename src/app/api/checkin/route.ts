import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Step 1: Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Step 2: Parse request body
    const body = await request.json();
    const { relapsed, mood, note } = body as {
      relapsed: boolean;
      mood: number | null;
      note: string | null;
    };

    // Step 3: Find user (with email fallback)
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

    // Step 4: Check if already checked in today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const existingCheckIn = await db.checkIn.findFirst({
      where: {
        userId: dbUser.id,
        date: { gte: startOfDay, lt: endOfDay },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({ 
        error: 'لقد قمت بالتسجيل اليوم بالفعل' 
      }, { status: 400 });
    }

    // Step 5: Create the check-in
    const checkIn = await db.checkIn.create({
      data: {
        userId: dbUser.id,
        relapsed,
        mood: mood || null,
        note: note || null,
        date: startOfDay,
      },
    });

    // Step 6: Update streak
    let newStreakDays = dbUser.streakDays;
    let newBestStreak = dbUser.bestStreak;

    if (relapsed) {
      // Reset streak on relapse
      newStreakDays = 0;
    } else {
      // Increment streak on clean day
      newStreakDays = dbUser.streakDays + 1;
      if (newStreakDays > newBestStreak) {
        newBestStreak = newStreakDays;
      }
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        streakDays: newStreakDays,
        bestStreak: newBestStreak,
      },
    });

    // Step 7: Return success
    return NextResponse.json({
      success: true,
      checkIn,
      newStreak: newStreakDays,
      newBestStreak,
    });
  } catch (error: any) {
    console.error('Check-in error:', error?.message);
    return NextResponse.json({ 
      error: 'حدث خطأ في الخادم',
      message: error?.message,
    }, { status: 500 });
  }
}
