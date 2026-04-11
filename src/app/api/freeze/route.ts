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

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (user.streakFreezesLeft <= 0) {
      return NextResponse.json(
        { error: 'لا يوجد أي تجميد متبقي لهذا الأسبوع' },
        { status: 400 }
      );
    }

    // Check if already used a freeze this week
    const now = new Date();
    // Find the start of this week (Monday)
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    if (user.lastFreezeUsedAt && user.lastFreezeUsedAt >= monday) {
      return NextResponse.json(
        { error: 'لقد استخدمت تجميدًا بالفعل هذا الأسبوع' },
        { status: 400 }
      );
    }

    // Use the freeze
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        streakFreezesLeft: user.streakFreezesLeft - 1,
        lastFreezeUsedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      streakFreezesLeft: updatedUser.streakFreezesLeft,
      streakDays: updatedUser.streakDays,
      message: 'تم تفعيل تجميد السلسلة! سلسلتك محمية من الانتكاس القادم.',
    });
  } catch (error) {
    console.error('Freeze error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
