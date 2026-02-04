import { z } from 'zod';
import { callAI } from './provider';

const VALID_SYNTAX_TYPES = [
  'bash',
  'shell',
  'git',
  'npm',
  'yarn',
  'pnpm',
  'typescript',
  'react',
  'javascript',
  'docker',
  'sql',
  'prompt',
  'code-comment',
  'plain',
] as const;

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export const generateChallengesInputSchema = z.object({
  topic: z
    .string()
    .min(2)
    .max(200)
    .describe('The topic or technology to generate challenges for'),
  difficulty: z.enum(VALID_DIFFICULTIES).optional(),
  syntaxType: z.enum(VALID_SYNTAX_TYPES).optional(),
  count: z.number().int().min(1).max(20).default(5),
  context: z
    .string()
    .max(500)
    .optional()
    .describe('Additional context for generating more relevant challenges'),
});

export type GenerateChallengesInput = z.infer<typeof generateChallengesInputSchema>;

const generatedChallengeSchema = z.object({
  content: z.string().min(1).max(500),
  difficulty: z.enum(VALID_DIFFICULTIES),
  syntaxType: z.enum(VALID_SYNTAX_TYPES),
  hint: z.string().max(200),
});

const generatedChallengesSchema = z.object({
  challenges: z.array(generatedChallengeSchema),
});

export type GeneratedChallenge = z.infer<typeof generatedChallengeSchema>;

export function buildPrompt(input: GenerateChallengesInput): string {
  const parts = [
    `Generate ${input.count} typing challenges for a developer typing trainer app.`,
    `Topic: ${input.topic}`,
  ];

  if (input.difficulty) {
    parts.push(`Difficulty: ${input.difficulty}`);
    parts.push(
      `- beginner: simple single commands or short snippets (under 60 characters)`,
      `- intermediate: commands with flags/options or multi-part snippets (60-120 characters)`,
      `- advanced: complex command chains, pipelines, or multi-line patterns (100-300 characters)`
    );
  } else {
    parts.push(
      'Include a mix of difficulties:',
      '- beginner: simple single commands or short snippets (under 60 characters)',
      '- intermediate: commands with flags/options or multi-part snippets (60-120 characters)',
      '- advanced: complex command chains, pipelines, or multi-line patterns (100-300 characters)'
    );
  }

  if (input.syntaxType) {
    parts.push(`Syntax type: ${input.syntaxType}`);
  } else {
    parts.push(
      'Choose the most appropriate syntax type for each challenge from: bash, shell, git, npm, yarn, pnpm, typescript, react, javascript, docker, sql, prompt, code-comment, plain'
    );
  }

  if (input.context) {
    parts.push(`Additional context: ${input.context}`);
  }

  parts.push(
    '',
    'Requirements:',
    '- Each challenge must be realistic code/commands that developers actually type',
    '- Content must be syntactically correct and follow best practices',
    '- Hints should be concise (one sentence) explaining what the command/snippet does',
    '- Do not include line numbers or markdown formatting in the content',
    '- For multi-line content, use \\n for newlines',
    '- Avoid duplicate or near-duplicate challenges',
    '',
    'Respond with valid JSON only, in this exact format:',
    '{"challenges": [{"content": "...", "difficulty": "beginner|intermediate|advanced", "syntaxType": "...", "hint": "..."}]}'
  );

  return parts.join('\n');
}

export async function generateChallenges(
  input: GenerateChallengesInput
): Promise<GeneratedChallenge[]> {
  const prompt = buildPrompt(input);
  const responseText = await callAI(prompt);

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const result = generatedChallengesSchema.parse(parsed);

  return result.challenges;
}
