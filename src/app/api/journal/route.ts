import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

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

    const whereClause: Record<string, unknown> = { userId: user.id };

    if (from || to) {
      whereClause.date = {};
      if (from) (whereClause.date as Record<string, unknown>).gte = new Date(from);
      if (to) (whereClause.date as Record<string, unknown>).lte = new Date(to);
    }

    const journals = await db.dailyJournal.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      journals: journals.map((j) => ({
        id: j.id,
        date: j.date.toISOString(),
        mood: j.mood,
        note: j.note,
      })),
    });
  } catch (error) {
    console.error('Journal GET error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, date, mood, note } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'التاريخ مطلوب' },
        { status: 400 }
      );
    }

    if (typeof mood !== 'number' || mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: 'المزاج يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    if (typeof note !== 'string' || !note.trim()) {
      return NextResponse.json(
        { error: 'الملاحظة مطلوبة' },
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

    // Parse date and set to start of day
    const journalDate = new Date(date);
    journalDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(journalDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Upsert: create or update journal for the date
    const journal = await db.dailyJournal.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: journalDate,
        },
      },
      update: {
        mood,
        note: note.trim(),
      },
      create: {
        userId: user.id,
        date: journalDate,
        mood,
        note: note.trim(),
      },
    });

    // Check for journal keeper achievement (5+ entries)
    const journalCount = await db.dailyJournal.count({
      where: { userId: user.id },
    });

    if (journalCount >= 5) {
      await db.userAchievement.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type: 'journal_keeper',
          },
        },
        update: {},
        create: {
          userId: user.id,
          type: 'journal_keeper',
        },
      });
    }

    return NextResponse.json({
      journal: {
        id: journal.id,
        date: journal.date.toISOString(),
        mood: journal.mood,
        note: journal.note,
      },
    });
  } catch (error) {
    console.error('Journal POST error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
