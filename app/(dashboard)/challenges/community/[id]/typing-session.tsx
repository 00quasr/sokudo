'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingInput, TypingStats, KeystrokeEvent } from '@/components/typing/TypingInput';
import { CommunitySessionComplete } from './session-complete';

interface CommunityTypingSessionProps {
  challengeId: number;
  content: string;
}

export function CommunityTypingSession({ challengeId, content }: CommunityTypingSessionProps) {
  const router = useRouter();
  const [sessionResult, setSessionResult] = useState<{
    wpm: number;
    rawWpm: number;
    accuracy: number;
    keystrokes: number;
    errors: number;
    durationMs: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [key, setKey] = useState(0);

  const handleComplete = useCallback((_stats: TypingStats, _keystrokeLog: KeystrokeEvent[]) => {
    setSessionResult({
      wpm: _stats.wpm,
      rawWpm: _stats.rawWpm,
      accuracy: _stats.accuracy,
      keystrokes: _stats.keystrokes,
      errors: _stats.errors,
      durationMs: _stats.durationMs,
    });
    setShowModal(true);
  }, []);

  const handleRetry = useCallback(() => {
    setSessionResult(null);
    setShowModal(false);
    setKey((prev) => prev + 1);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleBack = useCallback(() => {
    router.push('/challenges/community');
  }, [router]);

  return (
    <>
      <TypingInput
        key={key}
        targetText={content}
        syntaxType="plain"
        onComplete={handleComplete}
        showStats={true}
        autoFocus={true}
      />

      {sessionResult && (
        <CommunitySessionComplete
          open={showModal}
          result={sessionResult}
          onRetry={handleRetry}
          onClose={handleCloseModal}
          onBack={handleBack}
        />
      )}
    </>
  );
}
