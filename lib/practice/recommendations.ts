/**
 * Practice recommendations engine.
 *
 * Analyzes user performance data (sessions, weaknesses, category coverage)
 * and produces a ranked list of actionable recommendations like:
 *   - "You should practice git commands — your accuracy is 72%"
 *   - "Try harder challenges — your WPM is trending up"
 *   - "Focus on the 'e' key — it's your weakest at 68% accuracy"
 */

import type { WeaknessReport } from '@/lib/weakness/analyze';
import {
  computeAdaptiveDifficulty,
  type DifficultyLevel,
  type SessionPerformance,
} from '@/lib/practice/adaptive-difficulty';

export type RecommendationType =
  | 'weak_category'
  | 'unexplored_category'
  | 'weak_key'
  | 'slow_key'
  | 'common_typo'
  | 'problem_sequence'
  | 'difficulty_up'
  | 'difficulty_down'
  | 'accuracy_focus'
  | 'speed_focus'
  | 'streak_reminder'
  | 'practice_more';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface PracticeRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  metric?: string;
}

export interface CategoryPerformanceData {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  isPremium: boolean;
  sessions: number;
  avgWpm: number;
  avgAccuracy: number;
}

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  difficulty: string;
  isPremium: boolean;
}

export interface RecommendationInput {
  sessions: SessionPerformance[];
  weaknessReport: WeaknessReport | null;
  categoryPerformance: CategoryPerformanceData[];
  allCategories: CategoryInfo[];
  currentStreak: number;
  totalSessions: number;
  avgWpm: number;
  avgAccuracy: number;
  canAccessPremium: boolean;
}

const MAX_RECOMMENDATIONS = 5;

/**
 * Generate a ranked list of practice recommendations based on user data.
 */
export function generateRecommendations(
  input: RecommendationInput
): PracticeRecommendation[] {
  const recommendations: PracticeRecommendation[] = [];

  // No data at all — encourage starting
  if (input.totalSessions === 0) {
    recommendations.push({
      type: 'practice_more',
      priority: 'high',
      title: 'Start your first practice session',
      description:
        'Complete a typing challenge to begin tracking your progress and get personalised recommendations.',
      actionLabel: 'Start Practicing',
      actionHref: '/practice',
    });
    return recommendations;
  }

  // Difficulty-based recommendations
  addDifficultyRecommendations(recommendations, input);

  // Category weakness recommendations
  addCategoryRecommendations(recommendations, input);

  // Key/sequence weakness recommendations
  addWeaknessRecommendations(recommendations, input);

  // Accuracy and speed focus recommendations
  addFocusRecommendations(recommendations, input);

  // Streak encouragement
  addStreakRecommendation(recommendations, input);

  // Sort by priority then truncate
  const priorityOrder: Record<RecommendationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations.slice(0, MAX_RECOMMENDATIONS);
}

function addDifficultyRecommendations(
  recs: PracticeRecommendation[],
  input: RecommendationInput
): void {
  if (input.sessions.length < 3) return;

  const adaptive = computeAdaptiveDifficulty(input.sessions);

  if (adaptive.trend === 'increase' && adaptive.confidence >= 0.4) {
    recs.push({
      type: 'difficulty_up',
      priority: 'medium',
      title: 'Ready for harder challenges',
      description: `Your WPM is trending up and accuracy is strong. Try ${adaptive.recommendedDifficulty} difficulty challenges to keep improving.`,
      actionLabel: 'Smart Practice',
      actionHref: '/practice/smart',
      metric: `${adaptive.recommendedDifficulty} recommended`,
    });
  }

  if (adaptive.trend === 'decrease' && adaptive.confidence >= 0.4) {
    recs.push({
      type: 'difficulty_down',
      priority: 'medium',
      title: 'Consolidate your skills',
      description: `Your recent performance shows a dip. Practice at ${adaptive.recommendedDifficulty} difficulty to rebuild confidence before advancing.`,
      actionLabel: 'Smart Practice',
      actionHref: '/practice/smart',
      metric: `${adaptive.recommendedDifficulty} recommended`,
    });
  }
}

function addCategoryRecommendations(
  recs: PracticeRecommendation[],
  input: RecommendationInput
): void {
  const practicedSlugs = new Set(
    input.categoryPerformance.map((c) => c.categorySlug)
  );

  // Find unexplored categories (accessible only)
  const unexplored = input.allCategories.filter(
    (c) => (!c.isPremium || input.canAccessPremium) && !practicedSlugs.has(c.slug)
  );

  if (unexplored.length > 0) {
    const cat = unexplored[0];
    recs.push({
      type: 'unexplored_category',
      priority: 'low',
      title: `Try ${cat.name}`,
      description: `You haven't practiced ${cat.name} yet. Expanding to new categories builds well-rounded muscle memory.`,
      actionLabel: `Practice ${cat.name}`,
      actionHref: `/practice/${cat.slug}`,
    });
  }

  // Find weakest practiced category (by accuracy, min 3 sessions, accessible only)
  const weakCategories = input.categoryPerformance
    .filter((c) => c.sessions >= 3 && (!c.isPremium || input.canAccessPremium))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

  if (weakCategories.length > 0) {
    const worst = weakCategories[0];
    if (worst.avgAccuracy < 90) {
      recs.push({
        type: 'weak_category',
        priority: 'high',
        title: `Practice ${worst.categoryName}`,
        description: `Your accuracy in ${worst.categoryName} is ${worst.avgAccuracy}%. Focused practice here will have the biggest impact.`,
        actionLabel: `Practice ${worst.categoryName}`,
        actionHref: `/practice/${worst.categorySlug}`,
        metric: `${worst.avgAccuracy}% accuracy`,
      });
    }
  }

  // Find slowest category (by WPM, min 3 sessions, accessible only)
  const slowCategories = input.categoryPerformance
    .filter((c) => c.sessions >= 3 && c.avgAccuracy >= 85 && (!c.isPremium || input.canAccessPremium))
    .sort((a, b) => a.avgWpm - b.avgWpm);

  if (slowCategories.length > 0) {
    const slowest = slowCategories[0];
    // Only recommend if significantly slower than average
    if (input.avgWpm > 0 && slowest.avgWpm < input.avgWpm * 0.8) {
      recs.push({
        type: 'weak_category',
        priority: 'medium',
        title: `Speed up on ${slowest.categoryName}`,
        description: `Your WPM in ${slowest.categoryName} is ${slowest.avgWpm}, well below your ${input.avgWpm} average. More practice here will close the gap.`,
        actionLabel: `Practice ${slowest.categoryName}`,
        actionHref: `/practice/${slowest.categorySlug}`,
        metric: `${slowest.avgWpm} WPM`,
      });
    }
  }
}

function addWeaknessRecommendations(
  recs: PracticeRecommendation[],
  input: RecommendationInput
): void {
  const report = input.weaknessReport;
  if (!report) return;

  // Weak keys
  const weakKeys = report.weakestKeys.filter((k) => k.accuracy < 85);
  if (weakKeys.length > 0) {
    const worst = weakKeys[0];
    const keyLabel = formatKeyLabel(worst.key);
    const additionalCount = weakKeys.length - 1;
    const suffix =
      additionalCount > 0
        ? ` and ${additionalCount} other key${additionalCount > 1 ? 's' : ''}`
        : '';

    recs.push({
      type: 'weak_key',
      priority: 'high',
      title: `Focus on the '${keyLabel}' key${suffix}`,
      description: `Your accuracy on '${keyLabel}' is ${worst.accuracy}%. Personalized Practice generates exercises targeting your weak keys.`,
      actionLabel: 'Personalized Practice',
      actionHref: '/practice/personalized',
      metric: `${worst.accuracy}% accuracy`,
    });
  }

  // Slow keys
  const slowKeys = report.slowestKeys.filter((k) => k.avgLatencyMs > 300);
  if (slowKeys.length > 0 && recs.length < MAX_RECOMMENDATIONS) {
    const slowest = slowKeys[0];
    const keyLabel = formatKeyLabel(slowest.key);

    recs.push({
      type: 'slow_key',
      priority: 'medium',
      title: `Speed up the '${keyLabel}' key`,
      description: `You average ${slowest.avgLatencyMs}ms on '${keyLabel}'. Targeted practice can bring this closer to your normal speed.`,
      actionLabel: 'Personalized Practice',
      actionHref: '/practice/personalized',
      metric: `${slowest.avgLatencyMs}ms avg`,
    });
  }

  // Common typos
  if (report.commonTypos.length > 0 && recs.length < MAX_RECOMMENDATIONS) {
    const top = report.commonTypos[0];
    const expectedLabel = formatKeyLabel(top.expected);
    const actualLabel = formatKeyLabel(top.actual);

    recs.push({
      type: 'common_typo',
      priority: 'medium',
      title: `Fix '${expectedLabel}' → '${actualLabel}' typo`,
      description: `You've typed '${actualLabel}' instead of '${expectedLabel}' ${top.count} time${top.count !== 1 ? 's' : ''}. Practice will build the correct muscle memory.`,
      actionLabel: 'Personalized Practice',
      actionHref: '/practice/personalized',
      metric: `${top.count} occurrences`,
    });
  }

  // Problem sequences
  const badSequences = report.problemSequences.filter(
    (s) => s.errorRate >= 25
  );
  if (badSequences.length > 0 && recs.length < MAX_RECOMMENDATIONS) {
    const worst = badSequences[0];

    recs.push({
      type: 'problem_sequence',
      priority: 'medium',
      title: `Practice the "${worst.sequence}" sequence`,
      description: `You have a ${worst.errorRate}% error rate on "${worst.sequence}". Repetitive practice on this pattern will smooth it out.`,
      actionLabel: 'Personalized Practice',
      actionHref: '/practice/personalized',
      metric: `${worst.errorRate}% error rate`,
    });
  }
}

function addFocusRecommendations(
  recs: PracticeRecommendation[],
  input: RecommendationInput
): void {
  // Accuracy is the priority if below 85%
  if (input.avgAccuracy > 0 && input.avgAccuracy < 85) {
    recs.push({
      type: 'accuracy_focus',
      priority: 'high',
      title: 'Focus on accuracy over speed',
      description: `Your overall accuracy is ${input.avgAccuracy}%. Slow down and aim for fewer errors — speed follows accuracy.`,
      actionLabel: 'Smart Practice',
      actionHref: '/practice/smart',
      metric: `${input.avgAccuracy}% overall`,
    });
  }

  // Good accuracy but low WPM — push for speed
  if (input.avgAccuracy >= 92 && input.avgWpm > 0 && input.avgWpm < 30) {
    recs.push({
      type: 'speed_focus',
      priority: 'medium',
      title: 'Push your speed',
      description: `Your accuracy is excellent at ${input.avgAccuracy}% but your WPM is ${input.avgWpm}. You have room to type faster without sacrificing accuracy.`,
      actionLabel: 'Smart Practice',
      actionHref: '/practice/smart',
      metric: `${input.avgWpm} WPM`,
    });
  }
}

function addStreakRecommendation(
  recs: PracticeRecommendation[],
  input: RecommendationInput
): void {
  if (input.currentStreak > 0 && input.currentStreak >= 3) {
    recs.push({
      type: 'streak_reminder',
      priority: 'low',
      title: `Keep your ${input.currentStreak}-day streak alive`,
      description: `You're on a ${input.currentStreak}-day streak. A quick session today keeps the momentum going.`,
      actionLabel: 'Quick Practice',
      actionHref: '/practice/smart',
      metric: `${input.currentStreak} days`,
    });
  }

  if (input.totalSessions > 0 && input.totalSessions < 5) {
    recs.push({
      type: 'practice_more',
      priority: 'low',
      title: 'Build your practice habit',
      description: `You've completed ${input.totalSessions} session${input.totalSessions !== 1 ? 's' : ''}. A few more sessions will unlock better recommendations and adaptive difficulty.`,
      actionLabel: 'Keep Practicing',
      actionHref: '/practice',
      metric: `${input.totalSessions} sessions`,
    });
  }
}

function formatKeyLabel(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '\t') return 'Tab';
  if (key === '\n') return 'Enter';
  return key.toUpperCase();
}
