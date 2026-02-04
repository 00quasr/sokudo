import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

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
  generateAIPersonalizedPractice: vi.fn(),
  generatePersonalizedPractice: vi.fn(),
}));

import {
  getUser,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { generateAIPersonalizedPractice, generatePersonalizedPractice } from '@/lib/practice/personalized';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetKeyAccuracy = getKeyAccuracyForUser as ReturnType<typeof vi.fn>;
const mockGetCharErrors = getCharErrorPatternsForUser as ReturnType<typeof vi.fn>;
const mockGetProblemSeqs = getProblemSequences as ReturnType<typeof vi.fn>;
const mockAnalyze = analyzeWeaknesses as ReturnType<typeof vi.fn>;
const mockGenAI = generateAIPersonalizedPractice as ReturnType<typeof vi.fn>;
const mockGenStatic = generatePersonalizedPractice as ReturnType<typeof vi.fn>;

const defaultReport = {
  weakestKeys: [],
  slowestKeys: [],
  commonTypos: [],
  problemSequences: [],
  summary: { overallAccuracy: 95, avgLatencyMs: 120, totalKeysTracked: 0, keysNeedingWork: 0, sequencesNeedingWork: 0, topWeakness: null },
};

function createPostRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest(new URL('/api/practice/personalized/generate', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/practice/personalized/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetKeyAccuracy.mockResolvedValue([]);
    mockGetCharErrors.mockResolvedValue([]);
    mockGetProblemSeqs.mockResolvedValue([]);
    mockAnalyze.mockReturnValue(defaultReport);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createPostRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should use AI generation and return source: ai', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGenAI.mockResolvedValue({
      challenges: [{
        content: 'git commit -m "fix: update handler"',
        focusArea: 'weak-keys',
        targetKeys: ['q'],
        difficulty: 'intermediate',
        hint: 'AI generated challenge',
      }],
      summary: 'AI generated practice set.',
    });

    const request = createPostRequest({ maxChallenges: 3 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('ai');
    expect(data.challenges).toHaveLength(1);
  });

  it('should fall back to static generation when AI fails', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGenAI.mockRejectedValue(new Error('No AI provider configured'));
    mockGenStatic.mockReturnValue({
      challenges: [{
        content: 'const result = await fetch("/api/data").then(res => res.json());',
        focusArea: 'mixed',
        targetKeys: [],
        difficulty: 'intermediate',
        hint: 'Fallback challenge',
      }],
      summary: 'Static practice set.',
    });

    const request = createPostRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('static');
    expect(data.challenges).toHaveLength(1);
  });

  it('should accept focusArea parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGenAI.mockResolvedValue({
      challenges: [{
        content: 'export function handleKeyPress(event: KeyboardEvent) { }',
        focusArea: 'slow-keys',
        targetKeys: ['k'],
        difficulty: 'intermediate',
        hint: 'Focus on slow keys',
      }],
      summary: 'Practice set targeting slow keys.',
    });

    const request = createPostRequest({ focusArea: 'slow-keys', maxChallenges: 3 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGenAI).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ focusArea: 'slow-keys', maxChallenges: 3 })
    );
  });

  it('should return 400 for invalid parameters', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createPostRequest({ maxChallenges: 0 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid parameters');
  });

  it('should handle empty body gracefully', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockGenAI.mockResolvedValue({
      challenges: [{
        content: 'const result = await fetch("/api/data").then(res => res.json());',
        focusArea: 'mixed',
        targetKeys: [],
        difficulty: 'intermediate',
        hint: 'Default challenge',
      }],
      summary: 'Default practice set.',
    });

    const request = new NextRequest(
      new URL('/api/practice/personalized/generate', 'http://localhost:3000'),
      { method: 'POST' }
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
