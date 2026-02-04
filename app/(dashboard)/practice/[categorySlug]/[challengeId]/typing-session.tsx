'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingInput, TypingStats, KeystrokeEvent, SyntaxType } from '@/components/typing/TypingInput';
import { SessionComplete, SessionResult, AdaptiveDifficultyInfo } from '@/components/typing/SessionComplete';
import { ChallengeProgress } from '@/components/typing/ChallengeProgress';
import { Challenge, Category } from '@/lib/db/schema';

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

export function TypingSession({ challenge, categorySlug, nextChallengeId, challengePosition }: TypingSessionProps) {
  const router = useRouter();
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [key, setKey] = useState(0);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<AdaptiveDifficultyInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Navigate to next challenge or back to category list
  const navigateToNext = useCallback(() => {
    // Show progress indicator if there's a next challenge
    const targetId = adaptiveDifficulty?.suggestedChallengeId ?? nextChallengeId;
    if (targetId) {
      setIsTransitioning(true);
      // Delay navigation to show progress indicator
      setTimeout(() => {
        router.push(`/practice/${categorySlug}/${targetId}`);
      }, 1500);
    } else {
      router.push(`/practice/${categorySlug}`);
    }
  }, [router, categorySlug, nextChallengeId, adaptiveDifficulty]);

  const handleComplete = useCallback((stats: TypingStats, _keystrokeLog: KeystrokeEvent[]) => {
    const result = {
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      keystrokes: stats.keystrokes,
      errors: stats.errors,
      durationMs: stats.durationMs,
    };
    setSessionResult(result);

    // Only show modal when completing the last challenge in the category
    const isLastChallenge = !nextChallengeId;
    setShowModal(isLastChallenge);

    // Fetch adaptive difficulty recommendation in the background
    fetchAdaptiveDifficulty(categorySlug).then((info) => {
      if (info) {
        setAdaptiveDifficulty(info);
      }
    });

    // TODO: Save session to database via API
  }, [categorySlug, nextChallengeId]);

  const handleRetry = useCallback(() => {
    setSessionResult(null);
    setShowModal(false);
    setAdaptiveDifficulty(null);
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
          onRetry={handleRetry}
          onClose={handleCloseModal}
        />
      )}

      {challengePosition && (
        <ChallengeProgress
          current={challengePosition.current}
          total={challengePosition.total}
          isTransitioning={isTransitioning}
        />
      )}
    </>
  );
}
