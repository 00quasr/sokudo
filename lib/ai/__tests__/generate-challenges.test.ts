import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateChallengesInputSchema,
  buildPrompt,
  type GenerateChallengesInput,
} from '../generate-challenges';

// Mock the provider
vi.mock('../provider', () => ({
  callAI: vi.fn(),
}));

import { callAI } from '../provider';
import { generateChallenges } from '../generate-challenges';

const mockCallAI = callAI as unknown as ReturnType<typeof vi.fn>;

describe('generateChallengesInputSchema', () => {
  it('should accept valid input with all fields', () => {
    const input = {
      topic: 'git commands',
      difficulty: 'beginner',
      syntaxType: 'bash',
      count: 5,
      context: 'Focus on branching',
    };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept valid input with only required fields', () => {
    const input = { topic: 'docker' };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(5);
    }
  });

  it('should reject empty topic', () => {
    const input = { topic: '' };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject single-character topic', () => {
    const input = { topic: 'a' };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject topic exceeding 200 characters', () => {
    const input = { topic: 'x'.repeat(201) };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid difficulty', () => {
    const input = { topic: 'git', difficulty: 'impossible' };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid syntaxType', () => {
    const input = { topic: 'git', syntaxType: 'python' };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject count of 0', () => {
    const input = { topic: 'git', count: 0 };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject count exceeding 20', () => {
    const input = { topic: 'git', count: 21 };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject context exceeding 500 characters', () => {
    const input = { topic: 'git', context: 'x'.repeat(501) };
    const result = generateChallengesInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept all valid difficulty values', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
      const result = generateChallengesInputSchema.safeParse({
        topic: 'git',
        difficulty,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid syntaxType values', () => {
    const validTypes = [
      'bash', 'shell', 'git', 'npm', 'yarn', 'pnpm',
      'typescript', 'react', 'javascript', 'docker',
      'sql', 'prompt', 'code-comment', 'plain',
    ];
    for (const syntaxType of validTypes) {
      const result = generateChallengesInputSchema.safeParse({
        topic: 'test',
        syntaxType,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('buildPrompt', () => {
  it('should include topic and count', () => {
    const prompt = buildPrompt({ topic: 'git commands', count: 3 });
    expect(prompt).toContain('Generate 3');
    expect(prompt).toContain('git commands');
  });

  it('should include difficulty when specified', () => {
    const prompt = buildPrompt({ topic: 'react', difficulty: 'advanced', count: 1 });
    expect(prompt).toContain('Difficulty: advanced');
  });

  it('should include mix of difficulties when not specified', () => {
    const prompt = buildPrompt({ topic: 'react', count: 1 });
    expect(prompt).toContain('Include a mix of difficulties');
  });

  it('should include syntaxType when specified', () => {
    const prompt = buildPrompt({ topic: 'docker', syntaxType: 'bash', count: 1 });
    expect(prompt).toContain('Syntax type: bash');
  });

  it('should include context when specified', () => {
    const prompt = buildPrompt({
      topic: 'typescript',
      context: 'Focus on generics',
      count: 1,
    });
    expect(prompt).toContain('Focus on generics');
  });

  it('should include JSON format instructions', () => {
    const prompt = buildPrompt({ topic: 'git', count: 1 });
    expect(prompt).toContain('Respond with valid JSON only');
    expect(prompt).toContain('"challenges"');
  });
});

describe('generateChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return generated challenges from the AI response', async () => {
    const mockChallenges = {
      challenges: [
        {
          content: 'git status',
          difficulty: 'beginner',
          syntaxType: 'bash',
          hint: 'Check working directory status',
        },
        {
          content: 'git commit -m "fix: resolve bug"',
          difficulty: 'intermediate',
          syntaxType: 'bash',
          hint: 'Commit with a conventional commit message',
        },
      ],
    };

    mockCallAI.mockResolvedValue(JSON.stringify(mockChallenges));

    const result = await generateChallenges({ topic: 'git commands', count: 2 });

    expect(result).toEqual(mockChallenges.challenges);
    expect(mockCallAI).toHaveBeenCalledTimes(1);
    expect(mockCallAI).toHaveBeenCalledWith(expect.stringContaining('git commands'));
  });

  it('should extract JSON from AI response with surrounding text', async () => {
    const mockResponse = `Here are the challenges:\n${JSON.stringify({
      challenges: [
        {
          content: 'docker ps',
          difficulty: 'beginner',
          syntaxType: 'bash',
          hint: 'List running containers',
        },
      ],
    })}\nHope this helps!`;

    mockCallAI.mockResolvedValue(mockResponse);

    const result = await generateChallenges({ topic: 'docker', count: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('docker ps');
  });

  it('should throw on invalid JSON response', async () => {
    mockCallAI.mockResolvedValue('This is not JSON at all');

    await expect(
      generateChallenges({ topic: 'git', count: 1 })
    ).rejects.toThrow('AI response did not contain valid JSON');
  });

  it('should throw on invalid challenge structure', async () => {
    mockCallAI.mockResolvedValue(
      JSON.stringify({ challenges: [{ content: '', difficulty: 'invalid' }] })
    );

    await expect(
      generateChallenges({ topic: 'git', count: 1 })
    ).rejects.toThrow();
  });

  it('should propagate errors from the AI provider', async () => {
    mockCallAI.mockRejectedValue(new Error('API rate limit exceeded'));

    await expect(
      generateChallenges({ topic: 'git', count: 1 })
    ).rejects.toThrow('API rate limit exceeded');
  });
});
