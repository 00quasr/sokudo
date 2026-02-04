import { eq, sql, notInArray, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import {
  teamAchievements,
  earnedTeamAchievements,
  teamMembers,
  typingSessions,
  userProfiles,
  teamChallenges,
} from './schema';
import type { TeamAchievement } from './schema';

interface TeamAchievementCriteria {
  type:
    | 'team_sessions'
    | 'team_avg_wpm'
    | 'team_all_active'
    | 'team_practice_time'
    | 'team_avg_accuracy'
    | 'team_min_streak'
    | 'team_challenges_completed';
  threshold?: number;
  thresholdMs?: number;
}

interface UnlockedTeamAchievement {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export async function checkAndUnlockTeamAchievements(
  teamId: number
): Promise<UnlockedTeamAchievement[]> {
  const earnedRows = await db
    .select({ achievementId: earnedTeamAchievements.achievementId })
    .from(earnedTeamAchievements)
    .where(eq(earnedTeamAchievements.teamId, teamId));

  const earnedIds = earnedRows.map((r) => r.achievementId);

  const unearnedAchievements: TeamAchievement[] =
    earnedIds.length > 0
      ? await db
          .select()
          .from(teamAchievements)
          .where(notInArray(teamAchievements.id, earnedIds))
      : await db.select().from(teamAchievements);

  if (unearnedAchievements.length === 0) {
    return [];
  }

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const memberUserIds = members.map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return [];
  }

  const teamStats = await gatherTeamStats(teamId, memberUserIds);

  const newlyUnlocked: UnlockedTeamAchievement[] = [];

  for (const achievement of unearnedAchievements) {
    const criteria = achievement.criteria as TeamAchievementCriteria;
    const met = evaluateTeamCriteria(criteria, teamStats);

    if (met) {
      newlyUnlocked.push({
        id: achievement.id,
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
      });
    }
  }

  if (newlyUnlocked.length > 0) {
    await db.insert(earnedTeamAchievements).values(
      newlyUnlocked.map((a) => ({
        teamId,
        achievementId: a.id,
      }))
    );
  }

  return newlyUnlocked;
}

interface TeamStats {
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  totalPracticeTimeMs: number;
  totalMembers: number;
  membersWithSessions: number;
  minStreak: number;
  completedTeamChallenges: number;
}

async function gatherTeamStats(
  teamId: number,
  memberUserIds: number[]
): Promise<TeamStats> {
  const sessionStats = await db
    .select({
      userId: typingSessions.userId,
      totalSessions: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(round(avg(${typingSessions.wpm})), 0)::int`,
      avgAccuracy: sql<number>`coalesce(round(avg(${typingSessions.accuracy})), 0)::int`,
    })
    .from(typingSessions)
    .where(inArray(typingSessions.userId, memberUserIds))
    .groupBy(typingSessions.userId);

  const profiles = await db
    .select({
      userId: userProfiles.userId,
      currentStreak: userProfiles.currentStreak,
      totalPracticeTimeMs: userProfiles.totalPracticeTimeMs,
    })
    .from(userProfiles)
    .where(inArray(userProfiles.userId, memberUserIds));

  const completedChallenges = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamChallenges)
    .where(eq(teamChallenges.teamId, teamId));

  const activeMembers = sessionStats.filter((s) => s.totalSessions > 0);
  const totalSessions = activeMembers.reduce((sum, s) => sum + s.totalSessions, 0);
  const avgWpm =
    activeMembers.length > 0
      ? Math.round(activeMembers.reduce((sum, s) => sum + s.avgWpm, 0) / activeMembers.length)
      : 0;
  const avgAccuracy =
    activeMembers.length > 0
      ? Math.round(
          activeMembers.reduce((sum, s) => sum + s.avgAccuracy, 0) / activeMembers.length
        )
      : 0;
  const totalPracticeTimeMs = profiles.reduce((sum, p) => sum + p.totalPracticeTimeMs, 0);

  const streaks = profiles.map((p) => p.currentStreak);
  const minStreak = streaks.length > 0 ? Math.min(...streaks) : 0;

  return {
    totalSessions,
    avgWpm,
    avgAccuracy,
    totalPracticeTimeMs,
    totalMembers: memberUserIds.length,
    membersWithSessions: activeMembers.length,
    minStreak,
    completedTeamChallenges: completedChallenges[0]?.count ?? 0,
  };
}

function evaluateTeamCriteria(criteria: TeamAchievementCriteria, stats: TeamStats): boolean {
  switch (criteria.type) {
    case 'team_sessions':
      return stats.totalSessions >= (criteria.threshold ?? 0);
    case 'team_avg_wpm':
      return stats.avgWpm >= (criteria.threshold ?? 0);
    case 'team_all_active':
      return stats.totalMembers > 0 && stats.membersWithSessions >= stats.totalMembers;
    case 'team_practice_time':
      return stats.totalPracticeTimeMs >= (criteria.thresholdMs ?? 0);
    case 'team_avg_accuracy':
      return stats.avgAccuracy >= (criteria.threshold ?? 0);
    case 'team_min_streak':
      return stats.totalMembers > 0 && stats.minStreak >= (criteria.threshold ?? 0);
    case 'team_challenges_completed':
      return stats.completedTeamChallenges >= (criteria.threshold ?? 0);
    default:
      return false;
  }
}
