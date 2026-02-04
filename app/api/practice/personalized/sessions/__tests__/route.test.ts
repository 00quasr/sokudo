import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  upsertKeyAccuracy: vi.fn(),
  batchUpsertCharErrorPatterns: vi.fn(),
  batchUpsertSequenceErrorPatterns: vi.fn(),
  upsertDailyPractice: vi.fn(),
  updateUserTotalPracticeTime: vi.fn(),
  updateUserStreak: vi.fn(),
}));

vi.mock('@/lib/limits', () => ({
  checkSessionAllowed: vi.fn(),
  FREE_TIER_DAILY_LIMIT_MS: 900000,
}));

vi.mock('@/lib/practice/extract-sequences', () => ({
  extractSequences: vi.fn(),
}));

import {
  getUser,
  upsertKeyAccuracy,
  batchUpsertCharErrorPatterns,
  batchUpsertSequenceErrorPatterns,
  upsertDailyPractice,
  updateUserTotalPracticeTime,
  updateUserStreak,
} from '@/lib/db/queries';
import { checkSessionAllowed } from '@/lib/limits';
import { extractSequences } from '@/lib/practice/extract-sequences';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockUpsertKeyAccuracy = upsertKeyAccuracy as ReturnType<typeof vi.fn>;
const mockBatchUpsertCharErrors = batchUpsertCharErrorPatterns as ReturnType<typeof vi.fn>;
const mockBatchUpsertSeqErrors = batchUpsertSequenceErrorPatterns as ReturnType<typeof vi.fn>;
const mockUpsertDailyPractice = upsertDailyPractice as ReturnType<typeof vi.fn>;
const mockUpdatePracticeTime = updateUserTotalPracticeTime as ReturnType<typeof vi.fn>;
const mockUpdateStreak = updateUserStreak as ReturnType<typeof vi.fn>;
const mockCheckSession = checkSessionAllowed as ReturnType<typeof vi.fn>;
const mockExtractSequences = extractSequences as ReturnType<typeof vi.fn>;

function createRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('/api/practice/personalized/sessions', 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/practice/personalized/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckSession.mockResolvedValue({
      allowed: true,
      allowedDurationMs: 30000,
      limitExceeded: false,
    });
    mockExtractSequences.mockReturnValue([]);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 100,
      errors: 5, durationMs: 30000, focusArea: 'weak-keys',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid body', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest({ wpm: -1 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request body');
  });

  it('should return 400 when focusArea is missing', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 100,
      errors: 5, durationMs: 30000,
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 403 when practice limit is exceeded', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCheckSession.mockResolvedValue({
      allowed: false,
      allowedDurationMs: 0,
      limitExceeded: true,
    });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 100,
      errors: 5, durationMs: 30000, focusArea: 'weak-keys',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe('PRACTICE_LIMIT_EXCEEDED');
  });

  it('should save session without keystroke logs', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 100,
      errors: 5, durationMs: 30000, focusArea: 'weak-keys',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.saved).toBe(true);
    expect(data.focusArea).toBe('weak-keys');
    expect(mockUpsertDailyPractice).toHaveBeenCalled();
    expect(mockUpdatePracticeTime).toHaveBeenCalledWith(1, 30000);
    expect(mockUpdateStreak).toHaveBeenCalledWith(1);
  });

  it('should update key accuracy from keystroke logs', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 2,
      errors: 1, durationMs: 5000, focusArea: 'common-typos',
      keystrokeLogs: [
        { timestamp: 0, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
        { timestamp: 100, expected: 'b', actual: 'c', isCorrect: false, latencyMs: 150 },
      ],
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockUpsertKeyAccuracy).toHaveBeenCalledTimes(2);
    expect(mockUpsertKeyAccuracy).toHaveBeenCalledWith(1, 'a', true, 100);
    expect(mockUpsertKeyAccuracy).toHaveBeenCalledWith(1, 'b', false, 150);
  });

  it('should aggregate and save character error patterns', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 80, keystrokes: 5,
      errors: 2, durationMs: 10000, focusArea: 'weak-keys',
      keystrokeLogs: [
        { timestamp: 0, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
        { timestamp: 100, expected: 'b', actual: 'n', isCorrect: false, latencyMs: 120 },
        { timestamp: 200, expected: 'c', actual: 'c', isCorrect: true, latencyMs: 110 },
        { timestamp: 300, expected: 'b', actual: 'n', isCorrect: false, latencyMs: 130 },
        { timestamp: 400, expected: 'd', actual: 'd', isCorrect: true, latencyMs: 105 },
      ],
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockBatchUpsertCharErrors).toHaveBeenCalledWith(1, [
      { expectedChar: 'b', actualChar: 'n', count: 2 },
    ]);
  });

  it('should extract and save sequence error patterns', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockExtractSequences.mockReturnValue([
      { sequence: 'ab', hadError: false, latencyMs: 120 },
    ]);

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 2,
      errors: 0, durationMs: 5000, focusArea: 'problem-sequences',
      keystrokeLogs: [
        { timestamp: 0, expected: 'a', actual: 'a', isCorrect: true, latencyMs: 100 },
        { timestamp: 100, expected: 'b', actual: 'b', isCorrect: true, latencyMs: 120 },
      ],
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockExtractSequences).toHaveBeenCalled();
    expect(mockBatchUpsertSeqErrors).toHaveBeenCalledWith(1, [
      { sequence: 'ab', hadError: false, latencyMs: 120 },
    ]);
  });

  it('should include practice limit info when limit is reached', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    mockCheckSession.mockResolvedValue({
      allowed: true,
      allowedDurationMs: 5000,
      limitExceeded: true,
    });

    const request = createRequest({
      wpm: 60, rawWpm: 65, accuracy: 95, keystrokes: 100,
      errors: 5, durationMs: 30000, focusArea: 'mixed',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.practiceLimit).toBeTruthy();
    expect(data.practiceLimit.limitReached).toBe(true);
  });
});
