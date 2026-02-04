import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCallAI } = vi.hoisted(() => ({
  mockCallAI: vi.fn(),
}));

vi.mock('@/lib/ai/provider', () => ({
  callAI: mockCallAI,
}));

import { buildHintPrompt, generateHint, generateHintInputSchema } from '../generate-hints';
import type { GenerateHintInput } from '../generate-hints';

const baseInput: GenerateHintInput = {
  challengeContent: 'git stash pop',
  syntaxType: 'bash',
  difficulty: 'intermediate',
  categoryName: 'Git Commands',
};

describe('generateHintInputSchema', () => {
  it('should accept valid minimal input', () => {
    const result = generateHintInputSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it('should accept input with all optional fields', () => {
    const result = generateHintInputSchema.safeParse({
      ...baseInput,
      existingHint: 'Apply stashed changes',
      userWpm: 45,
      userAccuracy: 92,
      weakKeys: ['s', 't'],
      commonTypos: [{ expected: 's', actual: 'a' }],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty challengeContent', () => {
    const result = generateHintInputSchema.safeParse({
      ...baseInput,
      challengeContent: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const result = generateHintInputSchema.safeParse({
      syntaxType: 'bash',
    });
    expect(result.success).toBe(false);
  });
});

describe('buildHintPrompt', () => {
  it('should include challenge content in prompt', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).toContain('git stash pop');
  });

  it('should include category name', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).toContain('Git Commands');
  });

  it('should include syntax type', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).toContain('bash');
  });

  it('should include difficulty', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).toContain('intermediate');
  });

  it('should include existing hint when provided', () => {
    const prompt = buildHintPrompt({
      ...baseInput,
      existingHint: 'Apply stashed changes',
    });
    expect(prompt).toContain('Apply stashed changes');
  });

  it('should include user WPM when provided', () => {
    const prompt = buildHintPrompt({
      ...baseInput,
      userWpm: 45,
    });
    expect(prompt).toContain('WPM: 45');
  });

  it('should include user accuracy when provided', () => {
    const prompt = buildHintPrompt({
      ...baseInput,
      userAccuracy: 92,
    });
    expect(prompt).toContain('Accuracy: 92%');
  });

  it('should include weak keys when provided', () => {
    const prompt = buildHintPrompt({
      ...baseInput,
      weakKeys: ['s', 't', 'p'],
    });
    expect(prompt).toContain('Weak keys: s, t, p');
  });

  it('should include common typos when provided', () => {
    const prompt = buildHintPrompt({
      ...baseInput,
      commonTypos: [{ expected: 's', actual: 'a' }],
    });
    expect(prompt).toContain('"s" → "a"');
  });

  it('should not include performance section when no user data', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).not.toContain('User performance');
  });

  it('should request JSON output format', () => {
    const prompt = buildHintPrompt(baseInput);
    expect(prompt).toContain('Respond with valid JSON only');
    expect(prompt).toContain('"tip"');
    expect(prompt).toContain('"explanation"');
    expect(prompt).toContain('"improvementSuggestion"');
  });
});

describe('generateHint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parsed hint from AI response', async () => {
    const mockResponse = JSON.stringify({
      tip: 'Use git stash pop to apply and remove the most recent stash entry.',
      explanation:
        'git stash pop applies the changes from the top of the stash stack and removes the stash entry. It combines git stash apply and git stash drop.',
      improvementSuggestion:
        'Practice typing common git subcommands like stash, push, pull to build muscle memory for these frequent patterns.',
    });
    mockCallAI.mockResolvedValue(mockResponse);

    const result = await generateHint(baseInput);

    expect(result.tip).toContain('git stash pop');
    expect(result.explanation).toBeTruthy();
    expect(result.improvementSuggestion).toBeTruthy();
  });

  it('should handle AI response wrapped in markdown code block', async () => {
    const mockResponse =
      '```json\n{"tip": "A tip", "explanation": "An explanation", "improvementSuggestion": "A suggestion"}\n```';
    mockCallAI.mockResolvedValue(mockResponse);

    const result = await generateHint(baseInput);

    expect(result.tip).toBe('A tip');
    expect(result.explanation).toBe('An explanation');
    expect(result.improvementSuggestion).toBe('A suggestion');
  });

  it('should throw when AI response contains no JSON', async () => {
    mockCallAI.mockResolvedValue('Sorry, I cannot generate that.');

    await expect(generateHint(baseInput)).rejects.toThrow(
      'AI response did not contain valid JSON'
    );
  });

  it('should throw when AI response JSON is missing required fields', async () => {
    mockCallAI.mockResolvedValue('{"tip": "Only a tip"}');

    await expect(generateHint(baseInput)).rejects.toThrow();
  });

  it('should pass prompt to callAI', async () => {
    const mockResponse = JSON.stringify({
      tip: 'A tip',
      explanation: 'An explanation',
      improvementSuggestion: 'A suggestion',
    });
    mockCallAI.mockResolvedValue(mockResponse);

    await generateHint(baseInput);

    expect(mockCallAI).toHaveBeenCalledTimes(1);
    const prompt = mockCallAI.mock.calls[0][0];
    expect(prompt).toContain('git stash pop');
    expect(prompt).toContain('Git Commands');
  });
});
