import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Top current streaks
    const topStreaks = await db.user.findMany({
      where: { streakDays: { gt: 0 } },
      orderBy: { streakDays: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        streakDays: true,
        bestStreak: true,
      },
    });

    // Top best streaks (all time)
    const topBestStreaks = await db.user.findMany({
      where: { bestStreak: { gt: 0 } },
      orderBy: { bestStreak: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        bestStreak: true,
        streakDays: true,
      },
    });

    // Get check-in counts per user
    const usersWithCheckIns = await db.user.findMany({
      where: { checkIns: { some: {} } },
      select: {
        id: true,
        name: true,
        streakDays: true,
        bestStreak: true,
        _count: {
          select: { checkIns: true },
        },
      },
      orderBy: {
        checkIns: { _count: 'desc' },
      },
      take: 20,
    });

    const topCheckIns = usersWithCheckIns.map((u) => ({
      id: u.id,
      name: u.name,
      totalCheckIns: u._count.checkIns,
      streakDays: u.streakDays,
    }));

    // Get clean day counts per user
    const usersWithCleanDays = await db.user.findMany({
      where: { checkIns: { some: { relapsed: false } } },
      select: {
        id: true,
        name: true,
        streakDays: true,
        bestStreak: true,
        _count: {
          select: { checkIns: { where: { relapsed: false } } },
        },
      },
      orderBy: {
        checkIns: { _count: 'desc' },
      },
      take: 20,
    });

    const topCleanDays = usersWithCleanDays.map((u) => ({
      id: u.id,
      name: u.name,
      cleanDays: u._count.checkIns,
      streakDays: u.streakDays,
    }));

    // Mask names for privacy - show first name only + first letter of last name
    const maskName = (name: string | null, email?: string) => {
      if (name && name.trim()) {
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[1][0]}.`;
      }
      if (email) {
        return email.split('@')[0].substring(0, 3) + '***';
      }
      return 'مستخدم';
    };

    // Anonymize: hide user IDs from public, mask names
    const safeTopStreaks = topStreaks.map((u, i) => ({
      rank: i + 1,
      name: maskName(u.name),
      streakDays: u.streakDays,
      bestStreak: u.bestStreak,
    }));

    const safeTopBestStreaks = topBestStreaks.map((u, i) => ({
      rank: i + 1,
      name: maskName(u.name),
      bestStreak: u.bestStreak,
      currentStreak: u.streakDays,
    }));

    const safeTopCheckIns = topCheckIns.map((u, i) => ({
      rank: i + 1,
      name: maskName(u.name),
      totalCheckIns: u.totalCheckIns,
    }));

    const safeTopCleanDays = topCleanDays.map((u, i) => ({
      rank: i + 1,
      name: maskName(u.name),
      cleanDays: u.cleanDays,
    }));

    return NextResponse.json({
      topStreaks: safeTopStreaks,
      topBestStreaks: safeTopBestStreaks,
      topCheckIns: safeTopCheckIns,
      topCleanDays: safeTopCleanDays,
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error?.message);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
