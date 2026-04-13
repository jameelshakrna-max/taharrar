import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
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
        dbUser = existingByEmail;
      }
    } catch {
      // continue
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { name, goalStreak, preferredTheme, reminderEnabled, reminderTime } = body as {
      name?: string;
      goalStreak?: number;
      preferredTheme?: string;
      reminderEnabled?: boolean;
      reminderTime?: string;
    };

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (goalStreak !== undefined && goalStreak > 0) updateData.goalStreak = goalStreak;
    if (preferredTheme !== undefined) updateData.preferredTheme = preferredTheme;
    if (reminderEnabled !== undefined) updateData.reminderEnabled = reminderEnabled;
    if (reminderTime !== undefined) updateData.reminderTime = reminderTime;

    const updatedUser = await db.user.update({
      where: { id: dbUser.id },
      data: updateData,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Settings error:', error?.message);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
