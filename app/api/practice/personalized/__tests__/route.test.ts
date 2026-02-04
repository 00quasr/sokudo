import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getKeyAccuracyForUser: vi.fn(),
  getCharErrorPatternsForUser: vi.fn(),
  getProblemSequences: vi.fn(),
}));

vi.mock('@/lib/weakness/analyze', () => ({
  analyzeWeaknesses: vi.fn(),
}));

vi.mock('@/lib/practice/personalized', () => ({
  generatePersonalizedPractice: vi.fn(),
}));

import {
  getUser,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { generatePersonalizedPractice } from '@/lib/practice/personalized';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetKeyAccuracy = getKeyAccuracyForUser as ReturnType<typeof vi.fn>;
const mockGetCharErrors = getCharErrorPatternsForUser as ReturnType<typeof vi.fn>;
const mockGetProblemSeqs = getProblemSequences as ReturnType<typeof vi.fn>;
const mockAnalyze = analyzeWeaknesses as ReturnType<typeof vi.fn>;
const mockGenerate = generatePersonalizedPractice as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/practice/personalized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createRequest('/api/practice/personalized');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return personalized practice set for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetKeyAccuracy.mockResolvedValue([]);
    mockGetCharErrors.mockResolvedValue([]);
    mockGetProblemSeqs.mockResolvedValue([]);
    mockAnalyze.mockReturnValue({
      weakestKeys: [],
      slowestKeys: [],
      commonTypos: [],
      problemSequences: [],
      summary: { overallAccuracy: 95, avgLatencyMs: 120, totalKeysTracked: 0, keysNeedingWork: 0, sequencesNeedingWork: 0, topWeakness: null },
    });
    mockGenerate.mockReturnValue({
      challenges: [{
        content: 'const result = await fetch("/api/data").then(res => res.json());',
        focusArea: 'mixed',
        targetKeys: [],
        difficulty: 'intermediate',
        hint: 'No specific weaknesses detected yet.',
      }],
      summary: 'No significant weaknesses detected.',
    });

    const request = createRequest('/api/practice/personalized');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(1);
    expect(data.summary).toBeTruthy();
  });

  it('should pass maxChallenges query parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetKeyAccuracy.mockResolvedValue([]);
    mockGetCharErrors.mockResolvedValue([]);
    mockGetProblemSeqs.mockResolvedValue([]);
    mockAnalyze.mockReturnValue({
      weakestKeys: [],
      slowestKeys: [],
      commonTypos: [],
      problemSequences: [],
      summary: { overallAccuracy: 95, avgLatencyMs: 120, totalKeysTracked: 0, keysNeedingWork: 0, sequencesNeedingWork: 0, topWeakness: null },
    });
    mockGenerate.mockReturnValue({
      challenges: [],
      summary: '',
    });

    const request = createRequest('/api/practice/personalized?maxChallenges=3');
    await GET(request);

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.anything(),
      { maxChallenges: 3 }
    );
  });

  it('should return 400 for invalid maxChallenges', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest('/api/practice/personalized?maxChallenges=0');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should return 400 for maxChallenges exceeding limit', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest('/api/practice/personalized?maxChallenges=11');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should fetch user weakness data in parallel', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGetKeyAccuracy.mockResolvedValue([{ key: 'a', totalPresses: 100, correctPresses: 60, avgLatencyMs: 150 }]);
    mockGetCharErrors.mockResolvedValue([{ expectedChar: 'e', actualChar: 'r', count: 10 }]);
    mockGetProblemSeqs.mockResolvedValue([{ sequence: 'th', totalAttempts: 50, errorCount: 15, errorRate: 30, avgLatencyMs: 140 }]);
    mockAnalyze.mockReturnValue({
      weakestKeys: [{ key: 'a', accuracy: 60, totalPresses: 100, correctPresses: 60, avgLatencyMs: 150 }],
      slowestKeys: [],
      commonTypos: [{ expected: 'e', actual: 'r', count: 10 }],
      problemSequences: [{ sequence: 'th', totalAttempts: 50, errorCount: 15, errorRate: 30, avgLatencyMs: 140 }],
      summary: { overallAccuracy: 60, avgLatencyMs: 150, totalKeysTracked: 1, keysNeedingWork: 1, sequencesNeedingWork: 1, topWeakness: 'Key "A" at 60% accuracy' },
    });
    mockGenerate.mockReturnValue({
      challenges: [{
        content: 'attach array abstract async await',
        focusArea: 'weak-keys',
        targetKeys: ['a'],
        difficulty: 'beginner',
        hint: 'Practice key "a"',
      }],
      summary: '1 key below 90% accuracy.',
    });

    const request = createRequest('/api/practice/personalized');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetKeyAccuracy).toHaveBeenCalledWith(1);
    expect(mockGetCharErrors).toHaveBeenCalledWith(1);
    expect(mockGetProblemSeqs).toHaveBeenCalledWith(1, 10);
    expect(mockAnalyze).toHaveBeenCalled();
    expect(data.challenges[0].focusArea).toBe('weak-keys');
  });
});
