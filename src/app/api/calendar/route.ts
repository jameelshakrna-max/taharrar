import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Find user (with email fallback)
    let dbUser;
    try {
      dbUser = await db.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        const existingByEmail = await db.user.findUnique({ where: { email: user.email! } });
        dbUser = existingByEmail || await db.user.create({
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
    } catch (dbError: any) {
      console.error('DB user error:', dbError?.message);
      return NextResponse.json({ error: 'خطأ في قاعدة البيانات' }, { status: 500 });
    }

    // Get month from query params
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const checkIns = await db.checkIn.findMany({
      where: {
        userId: dbUser.id,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ checkIns });
  } catch (error: any) {
    console.error('Calendar error:', error?.message);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
