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

    // Get check-ins for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const checkIns = await db.checkIn.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Get journals for the last 6 months
    const journals = await db.dailyJournal.findMany({
      where: {
        userId: user.id,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      checkIns: checkIns.map((ci) => ({
        id: ci.id,
        date: ci.date.toISOString(),
        relapsed: ci.relapsed,
        mood: ci.mood,
        note: ci.note,
      })),
      journals: journals.map((j) => ({
        id: j.id,
        date: j.date.toISOString(),
        mood: j.mood,
        note: j.note,
      })),
    });
  } catch (error) {
    console.error('Calendar error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
