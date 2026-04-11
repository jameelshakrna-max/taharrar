import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ACHIEVEMENT_DEFINITIONS = [
  { type: 'first_checkin', name: 'البداية', description: 'أول تسجيل يومي', icon: '🌱' },
  { type: 'streak_3', name: '3 أيام', description: '3 أيام متتالية', icon: '⭐' },
  { type: 'streak_7', name: 'أسبوع', description: 'أسبوع كامل', icon: '🌟' },
  { type: 'streak_14', name: 'أسبوعان', description: 'أسبوعان متتاليان', icon: '💫' },
  { type: 'streak_30', name: 'شهر', description: 'شهر كامل', icon: '🏆' },
  { type: 'streak_60', name: 'شهران', description: 'شهران متتاليان', icon: '🥇' },
  { type: 'streak_90', name: '3 أشهر', description: 'ثلاثة أشهر متتالية', icon: '👑' },
  { type: 'streak_100', name: '100 يوم', description: 'مئة يوم متتالية', icon: '💯' },
  { type: 'streak_180', name: 'نصف عام', description: 'نصف عام متتالي', icon: '🔥' },
  { type: 'streak_365', name: 'سنة كاملة', description: 'سنة كاملة بدون انتكاس', icon: '🎖️' },
  { type: 'comeback', name: 'العودة', description: 'تعافي بعد انتكاس', icon: '💪' },
  { type: 'journal_keeper', name: 'كاتب اليوميات', description: '5+ مدونات يومية', icon: '📝' },
];

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

    // Get unlocked achievements
    const unlockedAchievements = await db.userAchievement.findMany({
      where: { userId: user.id },
    });

    const unlockedMap = new Map(
      unlockedAchievements.map((a) => [a.type, a.unlockedAt.toISOString()])
    );

    // Count journal entries
    const journalCount = await db.dailyJournal.count({
      where: { userId: user.id },
    });

    // Count total check-ins
    const checkinCount = await db.checkIn.count({
      where: { userId: user.id },
    });

    // Check for relapsed check-ins (to detect "comeback")
    const hasRelapsed = await db.checkIn.findFirst({
      where: { userId: user.id, relapsed: true },
    });

    // Retroactively unlock earned achievements
    const streakMilestones: Record<string, number> = {
      first_checkin: 1, streak_3: 3, streak_7: 7, streak_14: 14,
      streak_30: 30, streak_60: 60, streak_90: 90, streak_100: 100,
      streak_180: 180, streak_365: 365,
    };

    const newUnlocks: { type: string; unlockedAt: Date }[] = [];

    for (const [type, requiredBest] of Object.entries(streakMilestones)) {
      const met = type === 'first_checkin'
        ? checkinCount >= 1
        : user.bestStreak >= requiredBest;
      if (met && !unlockedMap.has(type)) {
        newUnlocks.push({ type, unlockedAt: new Date() });
      }
    }

    // Check comeback (has relapsed but currently has a streak)
    if (hasRelapsed && user.streakDays > 0 && !unlockedMap.has('comeback')) {
      newUnlocks.push({ type: 'comeback', unlockedAt: new Date() });
    }

    // Check journal keeper
    if (journalCount >= 5 && !unlockedMap.has('journal_keeper')) {
      newUnlocks.push({ type: 'journal_keeper', unlockedAt: new Date() });
    }

    // Insert any newly unlocked achievements
    if (newUnlocks.length > 0) {
      await db.userAchievement.createMany({
        data: newUnlocks.map((u) => ({ userId: user.id, ...u })),
      });
      for (const u of newUnlocks) {
        unlockedMap.set(u.type, u.unlockedAt.toISOString());
      }
    }

    const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      type: def.type,
      name: def.name,
      description: def.description,
      icon: def.icon,
      unlocked: unlockedMap.has(def.type),
      unlockedAt: unlockedMap.get(def.type) || null,
    }));

    return NextResponse.json({
      achievements,
      journalCount,
    });
  } catch (error) {
    console.error('Achievements error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
