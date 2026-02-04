import { describe, it, expect, vi } from 'vitest';
import {
  generatePersonalizedPractice,
  buildAIPromptForWeaknesses,
  generateAIPersonalizedPractice,
  type PersonalizedChallenge,
  type PersonalizedPracticeSet,
} from '../personalized';
import type { WeaknessReport } from '@/lib/weakness/analyze';
import type { SequenceErrorData } from '@/lib/db/queries';

function makeReport(overrides: Partial<WeaknessReport> = {}): WeaknessReport {
  return {
    weakestKeys: [],
    slowestKeys: [],
    commonTypos: [],
    problemSequences: [],
    summary: {
      overallAccuracy: 95,
      avgLatencyMs: 120,
      totalKeysTracked: 26,
      keysNeedingWork: 0,
      sequencesNeedingWork: 0,
      topWeakness: null,
    },
    ...overrides,
  };
}

describe('generatePersonalizedPractice', () => {
  describe('with no weaknesses', () => {
    it('should return a default challenge when no weakness data exists', () => {
      const report = makeReport();
      const result = generatePersonalizedPractice(report);

      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].focusArea).toBe('mixed');
      expect(result.challenges[0].hint).toContain('No specific weaknesses detected');
    });

    it('should include a summary indicating no weaknesses', () => {
      const report = makeReport();
      const result = generatePersonalizedPractice(report);

      expect(result.summary).toContain('No significant weaknesses');
    });
  });

  describe('with weak keys', () => {
    it('should generate challenges targeting weak keys', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'q', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
          { key: 'z', accuracy: 65, totalPresses: 40, correctPresses: 26, avgLatencyMs: 180 },
          { key: 'x', accuracy: 70, totalPresses: 45, correctPresses: 31, avgLatencyMs: 170 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      const weakKeyChallenge = result.challenges.find((c) => c.focusArea === 'weak-keys');

      expect(weakKeyChallenge).toBeDefined();
      expect(weakKeyChallenge!.targetKeys.length).toBeGreaterThan(0);
      expect(weakKeyChallenge!.hint).toContain('accuracy');
    });

    it('should set difficulty to beginner for very low accuracy keys', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'p', accuracy: 50, totalPresses: 50, correctPresses: 25, avgLatencyMs: 200 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      const weakKeyChallenge = result.challenges.find((c) => c.focusArea === 'weak-keys');

      expect(weakKeyChallenge).toBeDefined();
      expect(weakKeyChallenge!.difficulty).toBe('beginner');
    });

    it('should set difficulty to intermediate for moderate accuracy keys', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'e', accuracy: 80, totalPresses: 100, correctPresses: 80, avgLatencyMs: 120 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      const weakKeyChallenge = result.challenges.find((c) => c.focusArea === 'weak-keys');

      expect(weakKeyChallenge).toBeDefined();
      expect(weakKeyChallenge!.difficulty).toBe('intermediate');
    });
  });

  describe('with common typos', () => {
    it('should generate challenges for common typo patterns', () => {
      const report = makeReport({
        commonTypos: [
          { expected: 'e', actual: 'r', count: 25 },
          { expected: 'i', actual: 'o', count: 18 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      const typoChallenge = result.challenges.find((c) => c.focusArea === 'common-typos');

      expect(typoChallenge).toBeDefined();
      expect(typoChallenge!.hint).toContain('typo');
    });
  });

  describe('with problem sequences', () => {
    it('should generate challenges for problem sequences', () => {
      const sequences: SequenceErrorData[] = [
        { sequence: 'th', totalAttempts: 100, errorCount: 30, errorRate: 30, avgLatencyMs: 150 },
        { sequence: 'er', totalAttempts: 80, errorCount: 20, errorRate: 25, avgLatencyMs: 140 },
      ];

      const report = makeReport({ problemSequences: sequences });
      const result = generatePersonalizedPractice(report);
      const seqChallenge = result.challenges.find((c) => c.focusArea === 'problem-sequences');

      expect(seqChallenge).toBeDefined();
      expect(seqChallenge!.targetKeys).toContain('th');
      expect(seqChallenge!.hint).toContain('sequence');
    });

    it('should set beginner difficulty for high error rate sequences', () => {
      const sequences: SequenceErrorData[] = [
        { sequence: 'th', totalAttempts: 100, errorCount: 40, errorRate: 40, avgLatencyMs: 150 },
      ];

      const report = makeReport({ problemSequences: sequences });
      const result = generatePersonalizedPractice(report);
      const seqChallenge = result.challenges.find((c) => c.focusArea === 'problem-sequences');

      expect(seqChallenge).toBeDefined();
      expect(seqChallenge!.difficulty).toBe('beginner');
    });
  });

  describe('with slow keys', () => {
    it('should generate challenges for slow keys', () => {
      const report = makeReport({
        slowestKeys: [
          { key: 'j', avgLatencyMs: 350, totalPresses: 30, accuracy: 95 },
          { key: 'k', avgLatencyMs: 320, totalPresses: 25, accuracy: 92 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      const slowChallenge = result.challenges.find((c) => c.focusArea === 'slow-keys');

      expect(slowChallenge).toBeDefined();
      expect(slowChallenge!.hint).toContain('Speed up');
      expect(slowChallenge!.hint).toContain('latency');
    });
  });

  describe('with mixed weaknesses', () => {
    it('should generate a mixed challenge combining weakness types', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'q', accuracy: 70, totalPresses: 50, correctPresses: 35, avgLatencyMs: 200 },
        ],
        slowestKeys: [
          { key: 'z', avgLatencyMs: 300, totalPresses: 30, accuracy: 90 },
        ],
        commonTypos: [
          { expected: 'e', actual: 'r', count: 15 },
        ],
      });

      const result = generatePersonalizedPractice(report);

      // Should have multiple focus areas
      const focusAreas = result.challenges.map((c) => c.focusArea);
      expect(focusAreas.length).toBeGreaterThanOrEqual(3);
    });

    it('should add a mixed challenge when there is room', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 75, totalPresses: 50, correctPresses: 37, avgLatencyMs: 150 },
        ],
        slowestKeys: [
          { key: 'b', avgLatencyMs: 280, totalPresses: 40, accuracy: 92 },
        ],
      });

      const result = generatePersonalizedPractice(report, { maxChallenges: 5 });
      const mixedChallenge = result.challenges.find((c) => c.focusArea === 'mixed');

      expect(mixedChallenge).toBeDefined();
      expect(mixedChallenge!.difficulty).toBe('advanced');
    });
  });

  describe('challenge content quality', () => {
    it('should produce content with at least 20 characters', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
          { key: 'e', accuracy: 65, totalPresses: 80, correctPresses: 52, avgLatencyMs: 180 },
          { key: 'r', accuracy: 70, totalPresses: 90, correctPresses: 63, avgLatencyMs: 170 },
        ],
      });

      const result = generatePersonalizedPractice(report);

      for (const challenge of result.challenges) {
        expect(challenge.content.length).toBeGreaterThanOrEqual(20);
      }
    });

    it('should not exceed 200 characters per challenge', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
          { key: 'b', accuracy: 65, totalPresses: 80, correctPresses: 52, avgLatencyMs: 180 },
          { key: 'c', accuracy: 70, totalPresses: 90, correctPresses: 63, avgLatencyMs: 170 },
          { key: 'd', accuracy: 72, totalPresses: 70, correctPresses: 50, avgLatencyMs: 160 },
          { key: 'e', accuracy: 75, totalPresses: 60, correctPresses: 45, avgLatencyMs: 150 },
          { key: 'f', accuracy: 78, totalPresses: 50, correctPresses: 39, avgLatencyMs: 140 },
        ],
      });

      const result = generatePersonalizedPractice(report);

      for (const challenge of result.challenges) {
        expect(challenge.content.length).toBeLessThanOrEqual(200);
      }
    });
  });

  describe('maxChallenges option', () => {
    it('should respect maxChallenges limit', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
          { key: 'b', accuracy: 65, totalPresses: 80, correctPresses: 52, avgLatencyMs: 180 },
          { key: 'c', accuracy: 70, totalPresses: 90, correctPresses: 63, avgLatencyMs: 170 },
        ],
        slowestKeys: [
          { key: 'd', avgLatencyMs: 350, totalPresses: 30, accuracy: 95 },
        ],
        commonTypos: [
          { expected: 'e', actual: 'r', count: 25 },
        ],
        problemSequences: [
          { sequence: 'th', totalAttempts: 100, errorCount: 30, errorRate: 30, avgLatencyMs: 150 },
        ],
      });

      const result = generatePersonalizedPractice(report, { maxChallenges: 2 });
      expect(result.challenges.length).toBeLessThanOrEqual(2);
    });

    it('should default to 5 max challenges', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
          { key: 'b', accuracy: 65, totalPresses: 80, correctPresses: 52, avgLatencyMs: 180 },
          { key: 'c', accuracy: 70, totalPresses: 90, correctPresses: 63, avgLatencyMs: 170 },
          { key: 'd', accuracy: 72, totalPresses: 70, correctPresses: 50, avgLatencyMs: 160 },
          { key: 'e', accuracy: 75, totalPresses: 60, correctPresses: 45, avgLatencyMs: 150 },
          { key: 'f', accuracy: 78, totalPresses: 50, correctPresses: 39, avgLatencyMs: 140 },
        ],
        slowestKeys: [
          { key: 'g', avgLatencyMs: 350, totalPresses: 30, accuracy: 95 },
          { key: 'h', avgLatencyMs: 320, totalPresses: 25, accuracy: 92 },
        ],
        commonTypos: [
          { expected: 'i', actual: 'o', count: 25 },
          { expected: 'e', actual: 'r', count: 20 },
        ],
        problemSequences: [
          { sequence: 'th', totalAttempts: 100, errorCount: 30, errorRate: 30, avgLatencyMs: 150 },
          { sequence: 'er', totalAttempts: 80, errorCount: 20, errorRate: 25, avgLatencyMs: 140 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      expect(result.challenges.length).toBeLessThanOrEqual(5);
    });
  });

  describe('summary generation', () => {
    it('should include weak key count in summary', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
          { key: 'b', accuracy: 80, totalPresses: 80, correctPresses: 64, avgLatencyMs: 180 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      expect(result.summary).toContain('below 90% accuracy');
    });

    it('should include typo pattern count in summary', () => {
      const report = makeReport({
        commonTypos: [
          { expected: 'e', actual: 'r', count: 25 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      expect(result.summary).toContain('typo pattern');
    });

    it('should include problem sequence count in summary', () => {
      const report = makeReport({
        problemSequences: [
          { sequence: 'th', totalAttempts: 100, errorCount: 30, errorRate: 30, avgLatencyMs: 150 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      expect(result.summary).toContain('problem sequence');
    });

    it('should include exercises count in summary', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 200 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      expect(result.summary).toContain('exercise');
      expect(result.summary).toContain('generated');
    });
  });

  describe('challenge structure', () => {
    it('should include all required fields on each challenge', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 's', accuracy: 65, totalPresses: 100, correctPresses: 65, avgLatencyMs: 200 },
        ],
      });

      const result = generatePersonalizedPractice(report);

      for (const challenge of result.challenges) {
        expect(challenge).toHaveProperty('content');
        expect(challenge).toHaveProperty('focusArea');
        expect(challenge).toHaveProperty('targetKeys');
        expect(challenge).toHaveProperty('difficulty');
        expect(challenge).toHaveProperty('hint');
        expect(typeof challenge.content).toBe('string');
        expect(Array.isArray(challenge.targetKeys)).toBe(true);
        expect(['beginner', 'intermediate', 'advanced']).toContain(challenge.difficulty);
        expect([
          'weak-keys',
          'common-typos',
          'slow-keys',
          'problem-sequences',
          'mixed',
        ]).toContain(challenge.focusArea);
      }
    });
  });

  describe('special character handling', () => {
    it('should handle special character weaknesses with code snippets', () => {
      const report = makeReport({
        weakestKeys: [
          { key: '{', accuracy: 50, totalPresses: 30, correctPresses: 15, avgLatencyMs: 300 },
          { key: '(', accuracy: 55, totalPresses: 40, correctPresses: 22, avgLatencyMs: 280 },
        ],
        slowestKeys: [
          { key: '{', avgLatencyMs: 300, totalPresses: 30, accuracy: 50 },
        ],
      });

      const result = generatePersonalizedPractice(report);
      // Should produce at least one challenge
      expect(result.challenges.length).toBeGreaterThan(0);
    });
  });

  describe('deterministic output', () => {
    it('should produce the same output for the same input', () => {
      const report = makeReport({
        weakestKeys: [
          { key: 'r', accuracy: 70, totalPresses: 80, correctPresses: 56, avgLatencyMs: 180 },
          { key: 't', accuracy: 72, totalPresses: 90, correctPresses: 64, avgLatencyMs: 170 },
        ],
      });

      const result1 = generatePersonalizedPractice(report);
      const result2 = generatePersonalizedPractice(report);

      expect(result1.challenges.length).toBe(result2.challenges.length);
      for (let i = 0; i < result1.challenges.length; i++) {
        expect(result1.challenges[i].content).toBe(result2.challenges[i].content);
      }
    });
  });
});

describe('buildAIPromptForWeaknesses', () => {
  it('should include weak keys in the prompt', () => {
    const report = makeReport({
      weakestKeys: [
        { key: 'q', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
        { key: 'z', accuracy: 65, totalPresses: 40, correctPresses: 26, avgLatencyMs: 180 },
      ],
    });

    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Weak keys');
    expect(prompt).toContain('"q"');
    expect(prompt).toContain('60% accuracy');
    expect(prompt).toContain('"z"');
    expect(prompt).toContain('65% accuracy');
  });

  it('should include common typos in the prompt', () => {
    const report = makeReport({
      commonTypos: [
        { expected: 'e', actual: 'r', count: 25 },
      ],
    });

    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Common typo patterns');
    expect(prompt).toContain('"r"');
    expect(prompt).toContain('"e"');
    expect(prompt).toContain('25 times');
  });

  it('should include slow keys in the prompt', () => {
    const report = makeReport({
      slowestKeys: [
        { key: 'j', avgLatencyMs: 350, totalPresses: 30, accuracy: 95 },
      ],
    });

    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Slow keys');
    expect(prompt).toContain('"j"');
    expect(prompt).toContain('350ms');
  });

  it('should include problem sequences in the prompt', () => {
    const report = makeReport({
      problemSequences: [
        { sequence: 'th', totalAttempts: 100, errorCount: 30, errorRate: 30, avgLatencyMs: 150 },
      ],
    });

    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Problem character sequences');
    expect(prompt).toContain('"th"');
    expect(prompt).toContain('30% error rate');
  });

  it('should respect count option', () => {
    const report = makeReport();
    const prompt = buildAIPromptForWeaknesses(report, { count: 3 });

    expect(prompt).toContain('Generate 3 typing practice challenges');
  });

  it('should request JSON response format', () => {
    const report = makeReport();
    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Respond with valid JSON only');
    expect(prompt).toContain('"challenges"');
    expect(prompt).toContain('"focusArea"');
    expect(prompt).toContain('"targetKeys"');
  });

  it('should handle empty weakness report gracefully', () => {
    const report = makeReport();
    const prompt = buildAIPromptForWeaknesses(report);

    expect(prompt).toContain('Generate 5 typing practice challenges');
    // Should not contain any weakness sections
    expect(prompt).not.toContain('Weak keys');
    expect(prompt).not.toContain('Common typo patterns');
    expect(prompt).not.toContain('Slow keys');
    expect(prompt).not.toContain('Problem character sequences');
  });

  it('should filter by focusArea when specified', () => {
    const report = makeReport({
      weakestKeys: [
        { key: 'q', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
      ],
      slowestKeys: [
        { key: 'j', avgLatencyMs: 350, totalPresses: 30, accuracy: 95 },
      ],
      commonTypos: [
        { expected: 'e', actual: 'r', count: 25 },
      ],
    });

    const prompt = buildAIPromptForWeaknesses(report, { focusArea: 'weak-keys' });

    expect(prompt).toContain('Weak keys');
    expect(prompt).not.toContain('Slow keys');
    expect(prompt).not.toContain('Common typo patterns');
  });
});

describe('generateAIPersonalizedPractice', () => {
  it('should parse valid AI response into challenges', async () => {
    const mockResponse = JSON.stringify({
      challenges: [
        {
          content: 'git commit -m "fix: update query handler"',
          focusArea: 'weak-keys',
          targetKeys: ['q', 'z'],
          difficulty: 'intermediate',
          hint: 'Practice weak keys q and z in git commands',
        },
        {
          content: 'const result = await fetch("/api/data");',
          focusArea: 'common-typos',
          targetKeys: ['e', 'r'],
          difficulty: 'beginner',
          hint: 'Focus on e vs r distinction',
        },
      ],
    });

    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue(mockResponse),
    }));

    // Re-import to get mocked version
    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport({
      weakestKeys: [
        { key: 'q', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
      ],
    });

    const result = await genAI(report, { maxChallenges: 2 });

    expect(result.challenges).toHaveLength(2);
    expect(result.challenges[0].focusArea).toBe('weak-keys');
    expect(result.challenges[1].focusArea).toBe('common-typos');
    expect(result.summary).toBeTruthy();

    vi.doUnmock('@/lib/ai/provider');
  });

  it('should throw when AI returns no valid challenges', async () => {
    const mockResponse = JSON.stringify({
      challenges: [
        {
          content: 'ab', // Too short (< 20 chars)
          focusArea: 'weak-keys',
          targetKeys: [],
          difficulty: 'beginner',
          hint: 'short',
        },
      ],
    });

    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue(mockResponse),
    }));

    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport();

    await expect(genAI(report)).rejects.toThrow('AI generated no valid challenges');

    vi.doUnmock('@/lib/ai/provider');
  });

  it('should throw when AI returns invalid JSON', async () => {
    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue('not valid json at all'),
    }));

    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport();

    await expect(genAI(report)).rejects.toThrow();

    vi.doUnmock('@/lib/ai/provider');
  });

  it('should sanitize invalid focusArea values', async () => {
    const mockResponse = JSON.stringify({
      challenges: [
        {
          content: 'const handler = async (req: Request) => { return new Response(); };',
          focusArea: 'invalid-area',
          targetKeys: ['a'],
          difficulty: 'intermediate',
          hint: 'Practice async handlers',
        },
      ],
    });

    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue(mockResponse),
    }));

    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport({
      weakestKeys: [
        { key: 'a', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
      ],
    });

    const result = await genAI(report);

    expect(result.challenges[0].focusArea).toBe('mixed');

    vi.doUnmock('@/lib/ai/provider');
  });

  it('should truncate content exceeding max length', async () => {
    const longContent = 'a'.repeat(300);
    const mockResponse = JSON.stringify({
      challenges: [
        {
          content: longContent,
          focusArea: 'weak-keys',
          targetKeys: ['a'],
          difficulty: 'beginner',
          hint: 'Long content test',
        },
      ],
    });

    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue(mockResponse),
    }));

    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport({
      weakestKeys: [
        { key: 'a', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
      ],
    });

    const result = await genAI(report);

    expect(result.challenges[0].content.length).toBeLessThanOrEqual(200);

    vi.doUnmock('@/lib/ai/provider');
  });

  it('should respect maxChallenges option', async () => {
    const mockResponse = JSON.stringify({
      challenges: [
        {
          content: 'git commit -m "fix: update query handler"',
          focusArea: 'weak-keys',
          targetKeys: ['q'],
          difficulty: 'intermediate',
          hint: 'Hint 1',
        },
        {
          content: 'const result = await fetch("/api/data");',
          focusArea: 'common-typos',
          targetKeys: ['e'],
          difficulty: 'beginner',
          hint: 'Hint 2',
        },
        {
          content: 'docker run -p 3000:3000 --name myapp node:18',
          focusArea: 'slow-keys',
          targetKeys: ['d'],
          difficulty: 'advanced',
          hint: 'Hint 3',
        },
      ],
    });

    vi.doMock('@/lib/ai/provider', () => ({
      callAI: vi.fn().mockResolvedValue(mockResponse),
    }));

    const { generateAIPersonalizedPractice: genAI } = await import('../personalized');

    const report = makeReport({
      weakestKeys: [
        { key: 'q', accuracy: 60, totalPresses: 50, correctPresses: 30, avgLatencyMs: 200 },
      ],
    });

    const result = await genAI(report, { maxChallenges: 2 });

    expect(result.challenges.length).toBeLessThanOrEqual(2);

    vi.doUnmock('@/lib/ai/provider');
  });
});
