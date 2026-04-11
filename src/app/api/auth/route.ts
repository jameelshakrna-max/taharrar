import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If not, create new user
    if (!user) {
           user = await db.user.create({
        data: {
          id: crypto.randomUUID(), // Temporary fix until Supabase Auth takes over
          email: normalizedEmail,
          streakDays: 0,
          bestStreak: 0,
        },
      });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        streakDays: user.streakDays,
        bestStreak: user.bestStreak,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
