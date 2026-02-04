import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { apiRateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db/drizzle';
import {
  users,
  userProfiles,
  typingSessions,
  keystrokeLogs,
  dailyPractice,
  keyAccuracy,
  charErrorPatterns,
  sequenceErrorPatterns,
  achievements,
  userAchievements,
  customChallenges,
  challengeVotes,
  challengeCollections,
  collectionChallenges,
  teamMembers,
  teams,
  activityLogs,
  challenges,
  categories,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:export', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const [
      profileRows,
      sessionsRows,
      dailyPracticeRows,
      keyAccuracyRows,
      charErrorRows,
      sequenceErrorRows,
      achievementRows,
      customChallengeRows,
      voteRows,
      collectionRows,
      teamMembershipRows,
      activityLogRows,
    ] = await Promise.all([
      db
        .select({
          subscriptionTier: userProfiles.subscriptionTier,
          currentStreak: userProfiles.currentStreak,
          longestStreak: userProfiles.longestStreak,
          totalPracticeTimeMs: userProfiles.totalPracticeTimeMs,
          preferences: userProfiles.preferences,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1),

      db
        .select({
          id: typingSessions.id,
          wpm: typingSessions.wpm,
          rawWpm: typingSessions.rawWpm,
          accuracy: typingSessions.accuracy,
          keystrokes: typingSessions.keystrokes,
          errors: typingSessions.errors,
          durationMs: typingSessions.durationMs,
          completedAt: typingSessions.completedAt,
          challengeContent: challenges.content,
          challengeDifficulty: challenges.difficulty,
          categoryName: categories.name,
        })
        .from(typingSessions)
        .innerJoin(challenges, eq(typingSessions.challengeId, challenges.id))
        .innerJoin(categories, eq(challenges.categoryId, categories.id))
        .where(eq(typingSessions.userId, userId))
        .orderBy(desc(typingSessions.completedAt)),

      db
        .select({
          date: dailyPractice.date,
          practiceTimeMs: dailyPractice.practiceTimeMs,
          sessionsCompleted: dailyPractice.sessionsCompleted,
        })
        .from(dailyPractice)
        .where(eq(dailyPractice.userId, userId))
        .orderBy(desc(dailyPractice.date)),

      db
        .select({
          key: keyAccuracy.key,
          totalPresses: keyAccuracy.totalPresses,
          correctPresses: keyAccuracy.correctPresses,
          avgLatencyMs: keyAccuracy.avgLatencyMs,
        })
        .from(keyAccuracy)
        .where(eq(keyAccuracy.userId, userId)),

      db
        .select({
          expectedChar: charErrorPatterns.expectedChar,
          actualChar: charErrorPatterns.actualChar,
          count: charErrorPatterns.count,
        })
        .from(charErrorPatterns)
        .where(eq(charErrorPatterns.userId, userId)),

      db
        .select({
          sequence: sequenceErrorPatterns.sequence,
          totalAttempts: sequenceErrorPatterns.totalAttempts,
          errorCount: sequenceErrorPatterns.errorCount,
          avgLatencyMs: sequenceErrorPatterns.avgLatencyMs,
        })
        .from(sequenceErrorPatterns)
        .where(eq(sequenceErrorPatterns.userId, userId)),

      db
        .select({
          achievementName: achievements.name,
          achievementDescription: achievements.description,
          earnedAt: userAchievements.earnedAt,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId)),

      db
        .select({
          id: customChallenges.id,
          name: customChallenges.name,
          content: customChallenges.content,
          isPublic: customChallenges.isPublic,
          timesCompleted: customChallenges.timesCompleted,
          createdAt: customChallenges.createdAt,
        })
        .from(customChallenges)
        .where(eq(customChallenges.userId, userId)),

      db
        .select({
          challengeId: challengeVotes.challengeId,
          value: challengeVotes.value,
          createdAt: challengeVotes.createdAt,
        })
        .from(challengeVotes)
        .where(eq(challengeVotes.userId, userId)),

      db
        .select({
          id: challengeCollections.id,
          name: challengeCollections.name,
          description: challengeCollections.description,
          isPublic: challengeCollections.isPublic,
          createdAt: challengeCollections.createdAt,
        })
        .from(challengeCollections)
        .where(eq(challengeCollections.userId, userId)),

      db
        .select({
          teamName: teams.name,
          role: teamMembers.role,
          joinedAt: teamMembers.joinedAt,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, userId)),

      db
        .select({
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          ipAddress: activityLogs.ipAddress,
        })
        .from(activityLogs)
        .where(eq(activityLogs.userId, userId))
        .orderBy(desc(activityLogs.timestamp)),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profileRows[0] ?? null,
      typingSessions: sessionsRows,
      dailyPractice: dailyPracticeRows,
      keyAccuracy: keyAccuracyRows,
      charErrorPatterns: charErrorRows,
      sequenceErrorPatterns: sequenceErrorRows,
      achievements: achievementRows,
      customChallenges: customChallengeRows,
      challengeVotes: voteRows,
      challengeCollections: collectionRows,
      teamMemberships: teamMembershipRows,
      activityLogs: activityLogRows,
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sokudo-data-export-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data to JSON:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
