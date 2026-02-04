/**
 * Smart Practice engine that picks optimal challenges for the user
 * by combining adaptive difficulty with weakness-based scoring.
 *
 * Instead of generating synthetic word lists (like personalized practice),
 * Smart Practice selects real challenges from the database and ranks them
 * by how well they target the user's specific weaknesses at the
 * appropriate difficulty level.
 */

import type { WeaknessReport } from '@/lib/weakness/analyze';
import {
  computeAdaptiveDifficulty,
  type DifficultyLevel,
  type SessionPerformance,
} from '@/lib/practice/adaptive-difficulty';

export interface SmartChallenge {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  score: number;
  reasons: string[];
}

export interface SmartPracticeResult {
  challenges: SmartChallenge[];
  adaptive: {
    recommendedDifficulty: DifficultyLevel;
    difficultyScore: number;
    confidence: number;
    reasons: string[];
  };
  summary: string;
}

export interface ChallengeRow {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
}

export interface RecentSessionInfo {
  challengeId: number;
  categoryId: number;
}

/**
 * Score and rank challenges based on user performance data to pick
 * the optimal set for practice. Combines adaptive difficulty, weakness
 * targeting, category variety, and freshness (avoiding recent challenges).
 */
export function selectSmartChallenges(
  allChallenges: ChallengeRow[],
  sessions: SessionPerformance[],
  recentSessionInfo: RecentSessionInfo[],
  weaknessReport: WeaknessReport | null,
  options: { limit?: number } = {}
): SmartPracticeResult {
  const { limit = 5 } = options;

  const adaptiveResult = computeAdaptiveDifficulty(sessions);

  if (allChallenges.length === 0) {
    return {
      challenges: [],
      adaptive: {
        recommendedDifficulty: adaptiveResult.recommendedDifficulty,
        difficultyScore: adaptiveResult.difficultyScore,
        confidence: adaptiveResult.confidence,
        reasons: adaptiveResult.reasons,
      },
      summary: 'No challenges available.',
    };
  }

  const recentChallengeIds = new Set(recentSessionInfo.map((s) => s.challengeId));
  const recentCategoryIds = recentSessionInfo.map((s) => s.categoryId);

  // Count how many recent sessions per category to find under-practiced ones
  const categoryCounts = new Map<number, number>();
  for (const cId of recentCategoryIds) {
    categoryCounts.set(cId, (categoryCounts.get(cId) ?? 0) + 1);
  }

  // Extract weak characters from the weakness report
  const weakChars = new Set<string>();
  const slowChars = new Set<string>();
  const problemSequences: string[] = [];

  if (weaknessReport) {
    for (const k of weaknessReport.weakestKeys.slice(0, 8)) {
      weakChars.add(k.key.toLowerCase());
    }
    for (const k of weaknessReport.slowestKeys.slice(0, 8)) {
      slowChars.add(k.key.toLowerCase());
    }
    for (const s of weaknessReport.problemSequences.slice(0, 6)) {
      problemSequences.push(s.sequence.toLowerCase());
    }
  }

  // Score each challenge
  const scored: SmartChallenge[] = allChallenges.map((c) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Difficulty match (biggest factor: 0-40 points)
    const diffScore = scoreDifficultyMatch(
      c.difficulty,
      adaptiveResult.recommendedDifficulty
    );
    score += diffScore;
    if (diffScore >= 35) {
      reasons.push('Matches recommended difficulty');
    }

    // 2. Weakness targeting (0-30 points)
    const weaknessScore = scoreWeaknessMatch(
      c.content,
      weakChars,
      slowChars,
      problemSequences
    );
    score += weaknessScore;
    if (weaknessScore >= 15) {
      reasons.push('Targets your weak areas');
    }

    // 3. Freshness - penalize recently completed challenges (0 or -20)
    if (recentChallengeIds.has(c.id)) {
      score -= 20;
      reasons.push('Recently practiced');
    }

    // 4. Category variety bonus (0-15 points)
    const categoryPracticeCount = categoryCounts.get(c.categoryId) ?? 0;
    if (categoryPracticeCount === 0) {
      score += 15;
      reasons.push('New category to explore');
    } else if (categoryPracticeCount <= 2) {
      score += 8;
    }

    // 5. Small random factor for variety (0-5 points)
    score += seededRandom(c.id) * 5;

    return {
      ...c,
      score: Math.round(score * 100) / 100,
      reasons,
    };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);

  // Ensure category variety in the final selection
  const selected = selectWithVariety(scored, limit);

  const summaryParts: string[] = [];
  summaryParts.push(
    `Difficulty: ${adaptiveResult.recommendedDifficulty}`
  );
  if (weaknessReport && weaknessReport.summary.topWeakness) {
    summaryParts.push(`Top weakness: ${weaknessReport.summary.topWeakness}`);
  }
  summaryParts.push(
    `${selected.length} challenge${selected.length !== 1 ? 's' : ''} selected`
  );

  return {
    challenges: selected,
    adaptive: {
      recommendedDifficulty: adaptiveResult.recommendedDifficulty,
      difficultyScore: adaptiveResult.difficultyScore,
      confidence: adaptiveResult.confidence,
      reasons: adaptiveResult.reasons,
    },
    summary: summaryParts.join(' · '),
  };
}

/**
 * Score how well a challenge's difficulty matches the recommended difficulty.
 * Exact match = 40, adjacent = 20, two levels away = 5.
 */
function scoreDifficultyMatch(
  challengeDifficulty: string,
  recommended: DifficultyLevel
): number {
  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
  const challengeIdx = levels.indexOf(challengeDifficulty as DifficultyLevel);
  const recommendedIdx = levels.indexOf(recommended);

  if (challengeIdx === -1) return 10; // unknown difficulty, neutral score
  const distance = Math.abs(challengeIdx - recommendedIdx);

  if (distance === 0) return 40;
  if (distance === 1) return 20;
  return 5;
}

/**
 * Score how well a challenge's content targets user weaknesses.
 */
function scoreWeaknessMatch(
  content: string,
  weakChars: Set<string>,
  slowChars: Set<string>,
  problemSequences: string[]
): number {
  if (weakChars.size === 0 && slowChars.size === 0 && problemSequences.length === 0) {
    return 0;
  }

  const contentLower = content.toLowerCase();
  let score = 0;

  // Count weak character occurrences (up to 15 points)
  let weakCharHits = 0;
  for (const char of weakChars) {
    const count = countOccurrences(contentLower, char);
    if (count > 0) weakCharHits += Math.min(count, 5);
  }
  score += Math.min(weakCharHits * 2, 15);

  // Count slow character occurrences (up to 10 points)
  let slowCharHits = 0;
  for (const char of slowChars) {
    const count = countOccurrences(contentLower, char);
    if (count > 0) slowCharHits += Math.min(count, 3);
  }
  score += Math.min(slowCharHits, 10);

  // Check for problem sequences (up to 5 points)
  let seqHits = 0;
  for (const seq of problemSequences) {
    if (contentLower.includes(seq)) seqHits++;
  }
  score += Math.min(seqHits * 2, 5);

  return Math.min(score, 30);
}

function countOccurrences(text: string, char: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === char) count++;
  }
  return count;
}

/**
 * Select challenges ensuring at least some category variety.
 */
function selectWithVariety(
  sorted: SmartChallenge[],
  limit: number
): SmartChallenge[] {
  if (sorted.length <= limit) return sorted;

  const selected: SmartChallenge[] = [];
  const categoriesUsed = new Map<number, number>();
  const maxPerCategory = Math.max(2, Math.ceil(limit / 2));

  for (const challenge of sorted) {
    if (selected.length >= limit) break;

    const categoryCount = categoriesUsed.get(challenge.categoryId) ?? 0;
    if (categoryCount < maxPerCategory) {
      selected.push(challenge);
      categoriesUsed.set(challenge.categoryId, categoryCount + 1);
    }
  }

  // Fill remaining slots if needed
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((s) => s.id));
    for (const challenge of sorted) {
      if (selected.length >= limit) break;
      if (!selectedIds.has(challenge.id)) {
        selected.push(challenge);
      }
    }
  }

  return selected;
}

/**
 * Deterministic pseudo-random based on a seed (challenge ID).
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
