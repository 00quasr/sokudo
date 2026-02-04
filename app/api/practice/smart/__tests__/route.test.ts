import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
  getUserProfile: vi.fn(),
  getRecentSessionsForAdaptive: vi.fn(),
  getRecentSessionChallengeIds: vi.fn(),
  getAllChallengesWithCategories: vi.fn(),
  getKeyAccuracyForUser: vi.fn(),
  getCharErrorPatternsForUser: vi.fn(),
  getProblemSequences: vi.fn(),
}));

vi.mock('@/lib/weakness/analyze', () => ({
  analyzeWeaknesses: vi.fn(),
}));

vi.mock('@/lib/practice/smart-practice', () => ({
  selectSmartChallenges: vi.fn(),
}));

vi.mock('@/lib/limits/constants', () => ({
  canAccessPremiumCategories: vi.fn().mockReturnValue(false),
}));

import { GET } from '../route';
import {
  getUser,
  getUserProfile,
  getRecentSessionsForAdaptive,
  getRecentSessionChallengeIds,
  getAllChallengesWithCategories,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import { selectSmartChallenges } from '@/lib/practice/smart-practice';
import { canAccessPremiumCategories } from '@/lib/limits/constants';

const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockGetUserProfile = getUserProfile as ReturnType<typeof vi.fn>;
const mockGetRecentAdaptive = getRecentSessionsForAdaptive as ReturnType<typeof vi.fn>;
const mockGetRecentChallengeIds = getRecentSessionChallengeIds as ReturnType<typeof vi.fn>;
const mockGetAllChallenges = getAllChallengesWithCategories as ReturnType<typeof vi.fn>;
const mockGetKeyAccuracy = getKeyAccuracyForUser as ReturnType<typeof vi.fn>;
const mockGetCharErrors = getCharErrorPatternsForUser as ReturnType<typeof vi.fn>;
const mockGetProblemSeqs = getProblemSequences as ReturnType<typeof vi.fn>;
const mockAnalyze = analyzeWeaknesses as ReturnType<typeof vi.fn>;
const mockSelect = selectSmartChallenges as ReturnType<typeof vi.fn>;
const mockCanAccessPremium = canAccessPremiumCategories as ReturnType<typeof vi.fn>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function setupDefaultMocks() {
  mockGetRecentAdaptive.mockResolvedValue([]);
  mockGetRecentChallengeIds.mockResolvedValue([]);
  mockGetAllChallenges.mockResolvedValue([]);
  mockGetKeyAccuracy.mockResolvedValue([]);
  mockGetCharErrors.mockResolvedValue([]);
  mockGetProblemSeqs.mockResolvedValue([]);
  mockGetUserProfile.mockResolvedValue({ subscriptionTier: 'free' });
  mockCanAccessPremium.mockReturnValue(false);
  mockSelect.mockReturnValue({
    challenges: [],
    adaptive: { recommendedDifficulty: 'beginner', difficultyScore: 20, confidence: 0, reasons: [] },
    summary: 'No challenges available.',
  });
}

describe('GET /api/practice/smart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue(null);
    const request = createRequest('/api/practice/smart');
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return smart practice set for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    mockSelect.mockReturnValue({
      challenges: [{ id: 1, content: 'git commit', difficulty: 'beginner', score: 45 }],
      adaptive: { recommendedDifficulty: 'beginner', difficultyScore: 20, confidence: 0, reasons: [] },
      summary: 'Difficulty: beginner',
    });
    const request = createRequest('/api/practice/smart');
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.challenges).toHaveLength(1);
    expect(data.adaptive).toBeDefined();
    expect(data.summary).toBeTruthy();
  });

  it('should pass limit query parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    const request = createRequest('/api/practice/smart?limit=3');
    await GET(request);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.anything(), expect.anything(), expect.anything(), null, { limit: 3 }
    );
  });

  it('should return 400 for invalid limit parameter', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const request = createRequest('/api/practice/smart?limit=0');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 for limit exceeding max', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    const request = createRequest('/api/practice/smart?limit=21');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should filter premium challenges for free users', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    mockCanAccessPremium.mockReturnValue(false);
    mockGetAllChallenges.mockResolvedValue([
      { id: 1, isPremium: false },
      { id: 2, isPremium: true },
    ]);
    const request = createRequest('/api/practice/smart');
    await GET(request);
    const passedChallenges = mockSelect.mock.calls[0][0];
    expect(passedChallenges).toHaveLength(1);
    expect(passedChallenges[0].id).toBe(1);
  });

  it('should include premium challenges for pro users', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    mockGetUserProfile.mockResolvedValue({ subscriptionTier: 'pro' });
    mockCanAccessPremium.mockReturnValue(true);
    mockGetAllChallenges.mockResolvedValue([
      { id: 1, isPremium: false },
      { id: 2, isPremium: true },
    ]);
    const request = createRequest('/api/practice/smart');
    await GET(request);
    const passedChallenges = mockSelect.mock.calls[0][0];
    expect(passedChallenges).toHaveLength(2);
  });

  it('should pass null weakness report when no weakness data exists', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    const request = createRequest('/api/practice/smart');
    await GET(request);
    const passedWeaknessReport = mockSelect.mock.calls[0][3];
    expect(passedWeaknessReport).toBeNull();
  });

  it('should call analyzeWeaknesses when weakness data exists', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    mockGetKeyAccuracy.mockResolvedValue([{ key: 'a', totalPresses: 100, correctPresses: 60, avgLatencyMs: 150 }]);
    mockAnalyze.mockReturnValue({ weakestKeys: [], slowestKeys: [], commonTypos: [], problemSequences: [], summary: {} });
    const request = createRequest('/api/practice/smart');
    await GET(request);
    expect(mockAnalyze).toHaveBeenCalled();
    const passedWeaknessReport = mockSelect.mock.calls[0][3];
    expect(passedWeaknessReport).not.toBeNull();
  });

  it('should fetch all required data for smart selection', async () => {
    mockGetUser.mockResolvedValue({ id: 1, email: 'test@test.com' });
    setupDefaultMocks();
    const request = createRequest('/api/practice/smart');
    await GET(request);
    expect(mockGetRecentAdaptive).toHaveBeenCalledWith(10);
    expect(mockGetRecentChallengeIds).toHaveBeenCalledWith(20);
    expect(mockGetAllChallenges).toHaveBeenCalled();
    expect(mockGetKeyAccuracy).toHaveBeenCalledWith(1);
    expect(mockGetCharErrors).toHaveBeenCalledWith(1);
    expect(mockGetProblemSeqs).toHaveBeenCalledWith(1, 10);
    expect(mockGetUserProfile).toHaveBeenCalledWith(1);
  });
});
