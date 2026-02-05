import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../lib/api-client';
import { Config } from '../lib/config';

// Mock fetch
global.fetch = vi.fn();

// Mock Config
vi.mock('../lib/config', () => ({
  Config: {
    load: vi.fn(() => ({
      baseUrl: 'http://localhost:3000',
      apiKey: 'test-api-key',
    })),
    save: vi.fn(),
    clear: vi.fn(),
    isAuthenticated: vi.fn(() => true),
  },
}));

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    vi.clearAllMocks();
  });

  it('should verify API key', async () => {
    const mockResponse = {
      userId: 1,
      email: 'test@example.com',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.verifyApiKey('test-key');

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/keys/verify',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-key',
        },
      })
    );
  });

  it('should throw error for invalid API key', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    });

    await expect(client.verifyApiKey('invalid-key')).rejects.toThrow('Invalid API key');
  });

  it('should get categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Git Basics', slug: 'git-basics' },
      { id: 2, name: 'Docker', slug: 'docker' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    const result = await client.getCategories();

    expect(result).toEqual(mockCategories);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/categories',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
        }),
      })
    );
  });

  it('should get challenges with filters', async () => {
    const mockChallenges = [
      { id: 1, content: 'git status', categoryId: 1 },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChallenges,
    });

    const result = await client.getChallenges('git-basics', 'beginner');

    expect(result).toEqual(mockChallenges);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/challenges?category=git-basics&difficulty=beginner',
      expect.any(Object)
    );
  });

  it('should submit session', async () => {
    const sessionData = {
      challengeId: 1,
      wpm: 50,
      rawWpm: 55,
      accuracy: 95,
      keystrokes: 100,
      errors: 5,
      durationMs: 10000,
    };

    const mockResponse = {
      success: true,
      sessionId: 123,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.submitSession(sessionData);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/sessions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(sessionData),
      })
    );
  });

  it('should get user stats', async () => {
    const mockStats = {
      totalSessions: 10,
      avgWpm: 50,
      avgAccuracy: 95,
      totalPracticeTime: 100000,
      streak: 5,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    const result = await client.getUserStats(7);

    expect(result).toEqual(mockStats);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/stats?days=7',
      expect.any(Object)
    );
  });

  it('should handle API errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(client.getCategories()).rejects.toThrow('API Error: 500 - Internal Server Error');
  });
});
