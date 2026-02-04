import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const { mockGenerateChallenges } = vi.hoisted(() => ({
  mockGenerateChallenges: vi.fn(),
}));

// Mock auth session
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

// Mock AI generation with inline schema (avoids importing the real ai SDK)
vi.mock('@/lib/ai/generate-challenges', () => ({
  generateChallenges: mockGenerateChallenges,
  generateChallengesInputSchema: z.object({
    topic: z.string().min(2).max(200),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    syntaxType: z
      .enum([
        'bash', 'shell', 'git', 'npm', 'yarn', 'pnpm',
        'typescript', 'react', 'javascript', 'docker',
        'sql', 'prompt', 'code-comment', 'plain',
      ])
      .optional(),
    count: z.number().int().min(1).max(20).default(5),
    context: z.string().max(500).optional(),
  }),
}));

import { getSession } from '@/lib/auth/session';
import { POST } from '../route';

const mockGetSession = getSession as unknown as ReturnType<typeof vi.fn>;

function createMockPostRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('POST /api/challenges/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = createMockPostRequest({ topic: 'git commands' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 1 } });
    });

    it('should return 400 for missing topic', async () => {
      const request = createMockPostRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for empty topic', async () => {
      const request = createMockPostRequest({ topic: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for invalid difficulty', async () => {
      const request = createMockPostRequest({
        topic: 'git',
        difficulty: 'impossible',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for invalid count', async () => {
      const request = createMockPostRequest({
        topic: 'git',
        count: 25,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('successful generation', () => {
    const mockChallenges = [
      {
        content: 'git stash pop',
        difficulty: 'intermediate',
        syntaxType: 'bash',
        hint: 'Apply the most recently stashed changes',
      },
      {
        content: 'git log --oneline --graph',
        difficulty: 'advanced',
        syntaxType: 'bash',
        hint: 'View commit history as a compact graph',
      },
    ];

    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 1 } });
      mockGenerateChallenges.mockResolvedValue(mockChallenges);
    });

    it('should return generated challenges', async () => {
      const request = createMockPostRequest({
        topic: 'git commands',
        count: 2,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.challenges).toEqual(mockChallenges);
    });

    it('should pass validated input to generateChallenges', async () => {
      const request = createMockPostRequest({
        topic: 'docker',
        difficulty: 'beginner',
        syntaxType: 'bash',
        count: 3,
        context: 'Container management',
      });

      await POST(request);

      expect(mockGenerateChallenges).toHaveBeenCalledWith({
        topic: 'docker',
        difficulty: 'beginner',
        syntaxType: 'bash',
        count: 3,
        context: 'Container management',
      });
    });

    it('should use default count when not specified', async () => {
      const request = createMockPostRequest({ topic: 'react hooks' });

      await POST(request);

      expect(mockGenerateChallenges).toHaveBeenCalledWith(
        expect.objectContaining({ count: 5 })
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 1 } });
    });

    it('should return 503 when AI provider is not configured', async () => {
      mockGenerateChallenges.mockRejectedValue(
        new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.')
      );

      const request = createMockPostRequest({ topic: 'git' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI generation is not configured on this server');
    });

    it('should return 500 on unexpected errors', async () => {
      mockGenerateChallenges.mockRejectedValue(new Error('Network error'));

      const request = createMockPostRequest({ topic: 'git' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate challenges');
    });
  });
});
