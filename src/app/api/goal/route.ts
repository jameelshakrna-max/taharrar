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

    return NextResponse.json({
      goalStreak: user.goalStreak,
      streakDays: user.streakDays,
      bestStreak: user.bestStreak,
    });
  } catch (error) {
    console.error('Goal GET error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, goalStreak } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    if (typeof goalStreak !== 'number' || goalStreak < 1 || goalStreak > 3650) {
      return NextResponse.json(
        { error: 'الهدف يجب أن يكون بين 1 و 3650 يوم' },
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

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { goalStreak: Math.round(goalStreak) },
    });

    return NextResponse.json({
      goalStreak: updatedUser.goalStreak,
    });
  } catch (error) {
    console.error('Goal PUT error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
