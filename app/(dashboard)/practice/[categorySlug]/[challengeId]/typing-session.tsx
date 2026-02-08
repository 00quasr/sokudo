'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingInput, TypingStats, KeystrokeEvent, SyntaxType } from '@/components/typing/TypingInput';
import { SessionComplete, SessionResult, AdaptiveDifficultyInfo, CategoryAggregateStats } from '@/components/typing/SessionComplete';
import { OfflineIndicator } from '@/components/typing/OfflineIndicator';
import { Challenge, Category } from '@/lib/db/schema';
import { useOfflineSession } from '@/lib/hooks/useOfflineSession';

interface TypingSessionProps {
  challenge: Challenge & { category: Category };
  categorySlug: string;
  nextChallengeId?: number;
  challengePosition?: { current: number; total: number };
}

function mapSyntaxType(syntaxType: string): SyntaxType {
  const validTypes: SyntaxType[] = [
    'plain', 'git', 'shell', 'react', 'typescript',
    'docker', 'sql', 'npm', 'yarn', 'pnpm'
  ];

  // Map common alternatives
  const syntaxMap: Record<string, SyntaxType> = {
    'bash': 'shell',
    'terminal': 'shell',
    'ts': 'typescript',
    'js': 'typescript',
    'javascript': 'typescript',
    'jsx': 'react',
    'tsx': 'react',
  };

  const normalized = syntaxType.toLowerCase();

  if (validTypes.includes(normalized as SyntaxType)) {
    return normalized as SyntaxType;
  }

  if (syntaxMap[normalized]) {
    return syntaxMap[normalized];
  }

  return 'plain';
}

async function fetchAdaptiveDifficulty(
  categorySlug: string
): Promise<AdaptiveDifficultyInfo | null> {
  try {
    const res = await fetch(
      `/api/adaptive-difficulty?categorySlug=${encodeURIComponent(categorySlug)}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    if (!data.recommendation) return null;

    return {
      recommendedDifficulty: data.recommendation.recommendedDifficulty,
      currentDifficulty: data.recommendation.currentDifficulty,
      reason: data.recommendation.reason,
      suggestedChallengeId: data.suggestedChallenge?.id ?? undefined,
    };
  } catch {
    return null;
  }
}

async function fetchCategoryStats(
  categoryId: number
): Promise<CategoryAggregateStats | null> {
  try {
    const res = await fetch(`/api/category-stats?categoryId=${categoryId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function TypingSession({ challenge, categorySlug, nextChallengeId, challengePosition }: TypingSessionProps) {
  const router = useRouter();
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [key, setKey] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<AdaptiveDifficultyInfo | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryAggregateStats | null>(null);

  // Initialize offline session support
  const { saveSession, isOnline, pendingSyncCount, triggerSync } = useOfflineSession({
    challengeId: challenge.id,
    enableAutoSync: true,
  });

  // Navigate to next challenge or back to category list
  const navigateToNext = useCallback(() => {
    const targetId = adaptiveDifficulty?.suggestedChallengeId ?? nextChallengeId;
    if (targetId) {
      // Navigate directly without transition delay - user control is immediate
      router.push(`/practice/${categorySlug}/${targetId}`);
    } else {
      router.push(`/practice/${categorySlug}`);
    }
  }, [router, categorySlug, nextChallengeId, adaptiveDifficulty]);

  const handleComplete = useCallback((stats: TypingStats, keystrokeLog: KeystrokeEvent[]) => {
    const result = {
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      keystrokes: stats.keystrokes,
      errors: stats.errors,
      durationMs: stats.durationMs,
    };
    setSessionResult(result);

    // Save session to IndexedDB (will sync automatically when online)
    saveSession(result, keystrokeLog).catch((error) => {
      console.error('Failed to save session:', error);
    });

    // Only show modal when completing the last challenge in the category
    const isLastChallenge = !nextChallengeId;
    setShowModal(isLastChallenge);

    // Fetch adaptive difficulty recommendation in the background
    fetchAdaptiveDifficulty(categorySlug).then((info) => {
      if (info) {
        setAdaptiveDifficulty(info);
      }
    });

    // Fetch category aggregate stats if this is the last challenge
    if (isLastChallenge) {
      fetchCategoryStats(challenge.category.id).then((stats) => {
        if (stats) {
          setCategoryStats(stats);
        }
      });
    }

    // User presses Enter to advance - no auto-advance, giving full control
  }, [categorySlug, nextChallengeId, challenge.category.id, saveSession]);

  const handleRetry = useCallback(() => {
    setSessionResult(null);
    setShowModal(false);
    setAdaptiveDifficulty(null);
    setCategoryStats(null);
    setKey(prev => prev + 1);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Tab = skip to next challenge without completing
  const handleSkip = useCallback(() => {
    navigateToNext();
  }, [navigateToNext]);

  // Enter = go to next challenge after completion
  const handleNext = useCallback(() => {
    navigateToNext();
  }, [navigateToNext]);

  const syntaxType = mapSyntaxType(challenge.syntaxType);

  return (
    <>
      <OfflineIndicator
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSyncClick={triggerSync}
      />

      <TypingInput
        key={key}
        targetText={challenge.content}
        syntaxType={syntaxType}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onNext={handleNext}
        showStats={true}
        autoFocus={true}
      />

      {sessionResult && (
        <SessionComplete
          open={showModal}
          result={sessionResult}
          categorySlug={categorySlug}
          categoryName={challenge.category.name}
          nextChallengeId={nextChallengeId}
          adaptiveDifficulty={adaptiveDifficulty}
          challengeInfo={{
            content: challenge.content,
            syntaxType: challenge.syntaxType,
            difficulty: challenge.difficulty,
            hint: challenge.hint,
          }}
          categoryStats={categoryStats}
          onRetry={handleRetry}
          onClose={handleCloseModal}
        />
      )}

      {/* Progress shown inline in the stats bar instead of blocking overlay */}
    </>
  );
}
