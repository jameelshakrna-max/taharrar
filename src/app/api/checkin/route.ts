import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const STREAK_ACHIEVEMENTS = [
  { type: 'first_checkin', days: 0 },
  { type: 'streak_3', days: 3 },
  { type: 'streak_7', days: 7 },
  { type: 'streak_14', days: 14 },
  { type: 'streak_30', days: 30 },
  { type: 'streak_60', days: 60 },
  { type: 'streak_90', days: 90 },
  { type: 'streak_100', days: 100 },
  { type: 'streak_180', days: 180 },
  { type: 'streak_365', days: 365 },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, relapsed, mood, note } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    if (typeof relapsed !== 'boolean') {
      return NextResponse.json(
        { error: 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    // Validate optional mood
    if (mood !== undefined && mood !== null && (typeof mood !== 'number' || mood < 1 || mood > 5)) {
      return NextResponse.json(
        { error: 'المزاج يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    // Validate optional note
    if (note !== undefined && note !== null && typeof note !== 'string') {
      return NextResponse.json(
        { error: 'الملاحظة يجب أن تكون نصًا' },
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

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await db.checkIn.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'لقد قمت بالتسجيل بالفعل اليوم', alreadyCheckedIn: true },
        { status: 400 }
      );
    }

    // Check if user has a freeze active (streakFreezesLeft > 0 and used this week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const freezeUsedThisWeek = user.lastFreezeUsedAt
      ? new Date(user.lastFreezeUsedAt) >= monday
      : false;
    const hasFreeze = user.streakFreezesLeft > 0 && freezeUsedThisWeek;

    // Update streak
    let newStreakDays = user.streakDays;
    let newBestStreak = user.bestStreak;
    const previousStreak = user.streakDays;
    let freezeUsed = false;

    if (!relapsed) {
      // Didn't do the habit - good!
      newStreakDays = user.streakDays + 1;
      if (newStreakDays > user.bestStreak) {
        newBestStreak = newStreakDays;
      }
    } else {
      // Relapsed - check if freeze protects
      if (hasFreeze) {
        freezeUsed = true;
        // Consume the freeze - don't reset streak
        await db.user.update({
          where: { id: user.id },
          data: {
            streakFreezesLeft: user.streakFreezesLeft - 1,
          },
        });
        // Streak stays the same
      } else {
        // Reset streak
        newStreakDays = 0;
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        streakDays: newStreakDays,
        bestStreak: newBestStreak,
      },
    });

    // Create check-in record
    const checkInData: Record<string, unknown> = {
      userId: user.id,
      relapsed,
    };
    if (mood !== undefined && mood !== null) checkInData.mood = mood;
    if (note !== undefined && note !== null) checkInData.note = note.trim();

    await db.checkIn.create({
      data: checkInData as {
        userId: string;
        relapsed: boolean;
        mood?: number;
        note?: string;
      },
    });

    // Check and unlock achievements (non-blocking — failures won't break the check-in)
    const newAchievements: string[] = [];
    try {
      // First check-in achievement
      const existingFirst = await db.userAchievement.findUnique({
        where: {
          userId_type: {
            userId: user.id,
            type: 'first_checkin',
          },
        },
      });
      if (!existingFirst) {
        await db.userAchievement.create({
          data: { userId: user.id, type: 'first_checkin' },
        });
        newAchievements.push('first_checkin');
      }

      // Streak-based achievements
      for (const achievement of STREAK_ACHIEVEMENTS) {
        if (achievement.days > 0 && newStreakDays >= achievement.days) {
          const existing = await db.userAchievement.findUnique({
            where: {
              userId_type: {
                userId: user.id,
                type: achievement.type,
              },
            },
          });
          if (!existing) {
            await db.userAchievement.create({
              data: { userId: user.id, type: achievement.type },
            });
            newAchievements.push(achievement.type);
          }
        }
      }

      // Comeback achievement (streak > 0 after being 0)
      if (previousStreak === 0 && newStreakDays > 0 && !relapsed) {
        const totalCheckins = await db.checkIn.count({
          where: { userId: user.id },
        });
        if (totalCheckins > 1) {
          const existingComeback = await db.userAchievement.findUnique({
            where: {
              userId_type: {
                userId: user.id,
                type: 'comeback',
              },
            },
          });
          if (!existingComeback) {
            await db.userAchievement.create({
              data: { userId: user.id, type: 'comeback' },
            });
            newAchievements.push('comeback');
          }
        }
      }

      // Reset weekly freezes on Monday
      if (now.getDay() === 1) {
        await db.user.update({
          where: { id: user.id },
          data: {
            streakFreezesLeft: 1,
            lastFreezeUsedAt: null,
          },
        });
      }
    } catch (achievementError) {
      // Achievement failures are non-critical — log but don't fail the check-in
      console.error('Achievement check failed (non-critical):', achievementError);
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        streakDays: updatedUser.streakDays,
        bestStreak: updatedUser.bestStreak,
      },
      relapsed,
      freezeUsed,
      newAchievements,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
