import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: crypto.randomUUID(),
          email: normalizedEmail,
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}