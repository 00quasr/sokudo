'use client';

import { useState, useCallback } from 'react';
import { OnboardingGuide } from '@/components/onboarding/onboarding-guide';
import type { OnboardingStep, UserProgress } from '@/components/onboarding/onboarding-guide';
import { useRouter } from 'next/navigation';

interface OnboardingContentProps {
  steps: OnboardingStep[];
  initialProgress: UserProgress[];
}

export function OnboardingContent({ steps, initialProgress }: OnboardingContentProps) {
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<UserProgress[]>(initialProgress);

  const handleComplete = useCallback(async (stepId: number) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const { progress } = await response.json();

      // Update local state
      setUserProgress((prev) => {
        const existing = prev.find((p) => p.stepId === stepId);
        if (existing) {
          return prev.map((p) =>
            p.stepId === stepId ? { ...p, completed: true, skipped: false } : p
          );
        } else {
          return [...prev, { stepId, completed: true, skipped: false }];
        }
      });
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }, []);

  const handleSkip = useCallback(async (stepId: number) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          skipped: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Update local state
      setUserProgress((prev) => {
        const existing = prev.find((p) => p.stepId === stepId);
        if (existing) {
          return prev.map((p) =>
            p.stepId === stepId ? { ...p, skipped: true } : p
          );
        } else {
          return [...prev, { stepId, completed: false, skipped: true }];
        }
      });
    } catch (error) {
      console.error('Error skipping step:', error);
      throw error;
    }
  }, []);

  const handleClose = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <OnboardingGuide
      steps={steps}
      userProgress={userProgress}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onClose={handleClose}
    />
  );
}
