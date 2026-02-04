/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PersonalizedPracticeClient } from '../personalized-practice-client';
import type { PersonalizedChallenge } from '@/lib/practice/personalized';

// Mock the TypingInput component
vi.mock('@/components/typing/TypingInput', () => ({
  TypingInput: ({ targetText, onComplete, onSkip, onNext }: {
    targetText: string;
    onComplete?: (stats: { wpm: number; rawWpm: number; accuracy: number; keystrokes: number; errors: number; durationMs: number; latency: { avgLatencyMs: number; minLatencyMs: number; maxLatencyMs: number; stdDevLatencyMs: number; p50LatencyMs: number; p95LatencyMs: number } }) => void;
    onSkip?: () => void;
    onNext?: () => void;
  }) => (
    <div data-testid="typing-input">
      <span data-testid="target-text">{targetText}</span>
      <button data-testid="complete-btn" onClick={() => onComplete?.({
        wpm: 65,
        rawWpm: 70,
        accuracy: 95,
        keystrokes: 50,
        errors: 3,
        durationMs: 5000,
        latency: { avgLatencyMs: 100, minLatencyMs: 50, maxLatencyMs: 200, stdDevLatencyMs: 30, p50LatencyMs: 95, p95LatencyMs: 180 },
      })}>Complete</button>
      <button data-testid="skip-btn" onClick={() => onSkip?.()}>Skip</button>
      <button data-testid="next-btn" onClick={() => onNext?.()}>Next</button>
    </div>
  ),
}));

const mockChallenges: PersonalizedChallenge[] = [
  {
    content: 'git commit -m "fix: update query handler"',
    focusArea: 'weak-keys',
    targetKeys: ['q', 'z'],
    difficulty: 'intermediate',
    hint: 'Practice weak keys q and z',
  },
  {
    content: 'const result = await fetch("/api/data");',
    focusArea: 'common-typos',
    targetKeys: ['e', 'r'],
    difficulty: 'beginner',
    hint: 'Focus on e vs r distinction',
  },
  {
    content: 'docker run -p 3000:3000 --name app node:18',
    focusArea: 'slow-keys',
    targetKeys: ['d', 'k'],
    difficulty: 'advanced',
    hint: 'Speed up keys d and k',
  },
];

const defaultWeaknessReport = {
  weakKeyCount: 2,
  typoCount: 1,
  slowKeyCount: 2,
  sequenceCount: 0,
  topWeakness: 'Key "Q" at 60% accuracy',
};

describe('PersonalizedPracticeClient', () => {
  it('should render the first challenge', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Personalized practice targeting: 2 keys below 90% accuracy."
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByTestId('target-text').textContent).toBe(mockChallenges[0].content);
    expect(screen.getByText('Weak Keys')).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();
  });

  it('should show challenge hint', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByText('Practice weak keys q and z')).toBeTruthy();
  });

  it('should show summary bar', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Personalized practice targeting: 2 keys below 90% accuracy."
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByText(/Personalized practice targeting/)).toBeTruthy();
  });

  it('should show top weakness', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByText(/Key "Q" at 60% accuracy/)).toBeTruthy();
  });

  it('should advance to next challenge after completion and clicking next', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    // Complete the first challenge
    fireEvent.click(screen.getByTestId('complete-btn'));
    // Click next
    fireEvent.click(screen.getByTestId('next-btn'));

    expect(screen.getByTestId('target-text').textContent).toBe(mockChallenges[1].content);
    expect(screen.getByText('2 / 3')).toBeTruthy();
  });

  it('should skip to next challenge', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    fireEvent.click(screen.getByTestId('skip-btn'));

    expect(screen.getByTestId('target-text').textContent).toBe(mockChallenges[1].content);
  });

  it('should show completion view after all challenges', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    // Complete all 3 challenges
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('complete-btn'));
      if (i < 2) {
        fireEvent.click(screen.getByTestId('next-btn'));
      }
    }

    expect(screen.getByText('Practice Session Complete')).toBeTruthy();
    expect(screen.getByText('3 of 3 challenges completed')).toBeTruthy();
  });

  it('should show average stats in completion view', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    // Complete all challenges
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('complete-btn'));
      if (i < 2) {
        fireEvent.click(screen.getByTestId('next-btn'));
      }
    }

    // Should show Avg WPM and Avg Accuracy labels
    expect(screen.getByText('Avg WPM')).toBeTruthy();
    expect(screen.getByText('Avg Accuracy')).toBeTruthy();
    expect(screen.getByText('Total Errors')).toBeTruthy();
    // Average WPM should be 65 (all same mock value)
    expect(screen.getByText('65')).toBeTruthy();
  });

  it('should allow restarting the same set', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    // Complete all challenges
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('complete-btn'));
      if (i < 2) {
        fireEvent.click(screen.getByTestId('next-btn'));
      }
    }

    // Click retry same set
    fireEvent.click(screen.getByText('Retry Same Set'));

    // Should be back at first challenge
    expect(screen.getByTestId('target-text').textContent).toBe(mockChallenges[0].content);
    expect(screen.getByText('1 / 3')).toBeTruthy();
  });

  it('should show empty state when no challenges provided', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={[]}
        summary=""
        weaknessReport={{ ...defaultWeaknessReport, weakKeyCount: 0, typoCount: 0, slowKeyCount: 0 }}
      />
    );

    expect(screen.getByText('No personalized challenges available.')).toBeTruthy();
  });

  it('should show difficulty badge', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByText('intermediate')).toBeTruthy();
  });

  it('should show target keys', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    expect(screen.getByText('Targets: q, z')).toBeTruthy();
  });

  it('should display per-challenge results in completion view', () => {
    render(
      <PersonalizedPracticeClient
        initialChallenges={mockChallenges}
        summary="Test summary"
        weaknessReport={defaultWeaknessReport}
      />
    );

    // Complete all challenges
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('complete-btn'));
      if (i < 2) {
        fireEvent.click(screen.getByTestId('next-btn'));
      }
    }

    expect(screen.getByText('Challenge Results')).toBeTruthy();
    // Should show focus area labels
    expect(screen.getByText('Weak Keys')).toBeTruthy();
    expect(screen.getByText('Common Typos')).toBeTruthy();
    expect(screen.getByText('Slow Keys')).toBeTruthy();
  });
});
