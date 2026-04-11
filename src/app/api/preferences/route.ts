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

    // Check if freeze is available (reset every Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const freezeUsedThisWeek = user.lastFreezeUsedAt
      ? new Date(user.lastFreezeUsedAt) >= monday
      : false;

    return NextResponse.json({
      preferredTheme: user.preferredTheme,
      reminderEnabled: user.reminderEnabled,
      reminderTime: user.reminderTime,
      goalStreak: user.goalStreak,
      streakFreezesLeft: user.streakFreezesLeft,
      freezeUsedThisWeek,
    });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferredTheme, reminderEnabled, reminderTime, goalStreak } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
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

    const updateData: Record<string, unknown> = {};

    if (typeof preferredTheme === 'string') {
      if (preferredTheme !== 'dark' && preferredTheme !== 'light') {
        return NextResponse.json(
          { error: 'السمة يجب أن تكون dark أو light' },
          { status: 400 }
        );
      }
      updateData.preferredTheme = preferredTheme;
    }

    if (typeof reminderEnabled === 'boolean') {
      updateData.reminderEnabled = reminderEnabled;
    }

    if (typeof reminderTime === 'string') {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(reminderTime)) {
        return NextResponse.json(
          { error: 'وقت التذكير يجب أن يكون بصيغة HH:MM' },
          { status: 400 }
        );
      }
      updateData.reminderTime = reminderTime;
    }

    if (typeof goalStreak === 'number') {
      if (goalStreak < 1 || goalStreak > 3650) {
        return NextResponse.json(
          { error: 'الهدف يجب أن يكون بين 1 و 3650 يوم' },
          { status: 400 }
        );
      }
      updateData.goalStreak = Math.round(goalStreak);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'لم يتم تقديم أي بيانات للتحديث' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      preferredTheme: updatedUser.preferredTheme,
      reminderEnabled: updatedUser.reminderEnabled,
      reminderTime: updatedUser.reminderTime,
      goalStreak: updatedUser.goalStreak,
    });
  } catch (error) {
    console.error('Preferences PUT error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
