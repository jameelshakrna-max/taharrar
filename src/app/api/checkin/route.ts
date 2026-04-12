import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { relapsed, mood, note } = body;

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await db.checkIn.findFirst({
      where: { userId: dbUser.id, date: { gte: today, lt: tomorrow } },
    });

    if (existingCheckIn) {
      return NextResponse.json({ error: 'لقد قمت بتسجيل يومك بالفعل' }, { status: 400 });
    }

    const checkIn = await db.checkIn.create({
      data: {
        userId: dbUser.id,
        relapsed: relapsed || false,
        mood: mood ? parseInt(mood) : null,
        note: note || null,
      },
    });

    let newStreak = dbUser.streakDays;
    let newBestStreak = dbUser.bestStreak;

    if (!relapsed) {
      newStreak += 1;
      if (newStreak > newBestStreak) newBestStreak = newStreak;
    } else {
      newStreak = 0;
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: { streakDays: newStreak, bestStreak: newBestStreak },
    });

    return NextResponse.json({ checkIn, streakDays: newStreak });
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}