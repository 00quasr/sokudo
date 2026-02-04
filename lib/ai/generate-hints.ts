import { z } from 'zod';
import { callAI } from './provider';

export const generateHintInputSchema = z.object({
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
});

export type GenerateHintInput = z.infer<typeof generateHintInputSchema>;

const hintResponseSchema = z.object({
  tip: z.string().min(1).max(300),
  explanation: z.string().min(1).max(500),
  improvementSuggestion: z.string().min(1).max(300),
});

export type AIHintResponse = z.infer<typeof hintResponseSchema>;

export function buildHintPrompt(input: GenerateHintInput): string {
  const parts = [
    'You are helping a developer improve their typing skills for code and terminal commands.',
    '',
    `Challenge content: ${input.challengeContent}`,
    `Category: ${input.categoryName}`,
    `Syntax type: ${input.syntaxType}`,
    `Difficulty: ${input.difficulty}`,
  ];

  if (input.existingHint) {
    parts.push(`Existing hint: ${input.existingHint}`);
  }

  if (input.userWpm !== undefined || input.userAccuracy !== undefined) {
    parts.push('', 'User performance on this challenge:');
    if (input.userWpm !== undefined) {
      parts.push(`- WPM: ${input.userWpm}`);
    }
    if (input.userAccuracy !== undefined) {
      parts.push(`- Accuracy: ${input.userAccuracy}%`);
    }
  }

  if (input.weakKeys && input.weakKeys.length > 0) {
    parts.push(`- Weak keys: ${input.weakKeys.join(', ')}`);
  }

  if (input.commonTypos && input.commonTypos.length > 0) {
    const typoStr = input.commonTypos
      .map((t) => `"${t.expected}" → "${t.actual}"`)
      .join(', ');
    parts.push(`- Common typos: ${typoStr}`);
  }

  parts.push(
    '',
    'Generate three pieces of advice:',
    '1. "tip" - A concise technical tip about this specific command/code snippet (what it does, when to use it, or a best practice). Max 300 chars.',
    '2. "explanation" - A brief explanation of the syntax or pattern used, helping the developer understand what they are typing and why. Max 500 chars.',
    '3. "improvementSuggestion" - A specific, actionable suggestion to improve their typing speed or accuracy for this type of content. If user performance data is provided, tailor the suggestion to their weaknesses. Max 300 chars.',
    '',
    'Respond with valid JSON only in this exact format:',
    '{"tip": "...", "explanation": "...", "improvementSuggestion": "..."}'
  );

  return parts.join('\n');
}

export async function generateHint(
  input: GenerateHintInput
): Promise<AIHintResponse> {
  const prompt = buildHintPrompt(input);
  const responseText = await callAI(prompt);

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return hintResponseSchema.parse(parsed);
}
