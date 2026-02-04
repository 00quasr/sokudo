import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const { mockGenerateHint } = vi.hoisted(() => ({
  mockGenerateHint: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/ai/generate-hints', () => ({
  generateHint: mockGenerateHint,
  generateHintInputSchema: z.object({
    challengeContent: z.string().min(1).max(500),
    syntaxType: z.string().max(50),
    difficulty: z.string().max(20),
    categoryName: z.string().max(100),
    existingHint: z.string().max(200).optional(),
    userWpm: z.number().optional(),
    userAccuracy: z.number().optional(),
    weakKeys: z.array(z.string()).max(10).optional(),
    commonTypos: z
      .array(z.object({ expected: z.string(), actual: z.string() }))
      .max(5)
      .optional(),
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

describe('POST /api/practice/hints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = createMockPostRequest({
        challengeContent: 'git init',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
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

    it('should return 400 for missing challengeContent', async () => {
      const request = createMockPostRequest({
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for empty challengeContent', async () => {
      const request = createMockPostRequest({
        challengeContent: '',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing required fields', async () => {
      const request = createMockPostRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('successful generation', () => {
    const mockHintResponse = {
      tip: 'Use git init to create a new repository.',
      explanation: 'git init initializes a new Git repository in the current directory.',
      improvementSuggestion: 'Practice short commands first to build speed before tackling complex chains.',
    };

    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 1 } });
      mockGenerateHint.mockResolvedValue(mockHintResponse);
    });

    it('should return generated hint', async () => {
      const request = createMockPostRequest({
        challengeContent: 'git init',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hint).toEqual(mockHintResponse);
    });

    it('should pass validated input to generateHint', async () => {
      const input = {
        challengeContent: 'docker build -t app .',
        syntaxType: 'docker',
        difficulty: 'intermediate',
        categoryName: 'Docker',
        existingHint: 'Build an image',
        userWpm: 40,
        userAccuracy: 88,
      };
      const request = createMockPostRequest(input);

      await POST(request);

      expect(mockGenerateHint).toHaveBeenCalledWith(input);
    });

    it('should accept optional weakness data', async () => {
      const input = {
        challengeContent: 'git init',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
        weakKeys: ['g', 'i'],
        commonTypos: [{ expected: 'i', actual: 'u' }],
      };
      const request = createMockPostRequest(input);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockGenerateHint).toHaveBeenCalledWith(input);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 1 } });
    });

    it('should return 503 when AI provider is not configured', async () => {
      mockGenerateHint.mockRejectedValue(
        new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.')
      );

      const request = createMockPostRequest({
        challengeContent: 'git init',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('AI generation is not configured on this server');
    });

    it('should return 500 on unexpected errors', async () => {
      mockGenerateHint.mockRejectedValue(new Error('Network error'));

      const request = createMockPostRequest({
        challengeContent: 'git init',
        syntaxType: 'bash',
        difficulty: 'beginner',
        categoryName: 'Git',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate hint');
    });
  });
});
