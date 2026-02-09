import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedCommand } from './parsers';

export interface AnalyzedCommand {
  content: string;
  category: string;
  importance: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  syntaxType: string;
  hint: string;
}

const ANALYSIS_PROMPT = `You are analyzing commands from a GitHub repository for typing practice.

Repository: {repoName}
Commands extracted:
{commandsJson}

Tasks:
1. Remove duplicates and trivial commands (single words, comments, echo statements)
2. Categorize each by type (git, docker, npm, shell, kubernetes, etc.)
3. Score importance 1-10 based on learning value for developers:
   - High importance (8-10): Essential commands used frequently (git commit, npm install, docker build)
   - Medium importance (5-7): Useful but less common commands
   - Low importance (1-4): Very specific or rarely used commands
4. Generate a concise hint explaining what each command does (max 100 chars)
5. Assign difficulty based on character count and complexity:
   - beginner: <60 chars, simple syntax
   - intermediate: 60-120 chars, moderate complexity
   - advanced: >120 chars or complex flags/pipes

Return ONLY valid JSON with no additional text:
{ "commands": [{ "content": "...", "category": "...", "importance": 5, "difficulty": "beginner", "syntaxType": "...", "hint": "..." }] }

Important:
- Return at most 50 commands, prioritizing the most important ones
- Exclude trivial commands like "cd", "ls", "echo", "true", "exit"
- Exclude commands that are just variable assignments
- syntaxType should be one of: git, docker, npm, shell, kubernetes, make, python, rust, go
- The "content" field should be the actual command to type, cleaned up if needed`;

/**
 * Analyze extracted commands using AI to dedupe, categorize, and generate hints
 * Prefers OpenAI, falls back to Anthropic, then to basic analysis
 */
export async function analyzeCommands(
  repoName: string,
  commands: ExtractedCommand[]
): Promise<AnalyzedCommand[]> {
  // Limit commands to prevent token overflow
  const limitedCommands = commands.slice(0, 100);

  const prompt = ANALYSIS_PROMPT
    .replace('{repoName}', repoName)
    .replace('{commandsJson}', JSON.stringify(limitedCommands, null, 2));

  // Try OpenAI first
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      return await analyzeWithOpenAI(prompt, openaiKey);
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
    }
  }

  // Fall back to Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      return await analyzeWithAnthropic(prompt, anthropicKey);
    } catch (error) {
      console.error('Anthropic analysis failed:', error);
    }
  }

  // Fall back to basic analysis
  console.log('No AI API key available, using basic analysis');
  return basicAnalysis(commands);
}

/**
 * Analyze commands using OpenAI GPT-4o-mini
 */
async function analyzeWithOpenAI(prompt: string, apiKey: string): Promise<AnalyzedCommand[]> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.commands)) {
    throw new Error('Invalid response format');
  }

  return parsed.commands.map((cmd: Record<string, unknown>) => ({
    content: String(cmd.content || ''),
    category: String(cmd.category || 'shell'),
    importance: Number(cmd.importance) || 5,
    difficulty: validateDifficulty(cmd.difficulty),
    syntaxType: String(cmd.syntaxType || 'shell'),
    hint: String(cmd.hint || ''),
  }));
}

/**
 * Analyze commands using Anthropic Claude Haiku
 */
async function analyzeWithAnthropic(prompt: string, apiKey: string): Promise<AnalyzedCommand[]> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = JSON.parse(content.text);

  if (!Array.isArray(parsed.commands)) {
    throw new Error('Invalid response format');
  }

  return parsed.commands.map((cmd: Record<string, unknown>) => ({
    content: String(cmd.content || ''),
    category: String(cmd.category || 'shell'),
    importance: Number(cmd.importance) || 5,
    difficulty: validateDifficulty(cmd.difficulty),
    syntaxType: String(cmd.syntaxType || 'shell'),
    hint: String(cmd.hint || ''),
  }));
}

function validateDifficulty(value: unknown): 'beginner' | 'intermediate' | 'advanced' {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
    return value;
  }
  return 'beginner';
}

/**
 * Basic analysis without AI (fallback)
 */
function basicAnalysis(commands: ExtractedCommand[]): AnalyzedCommand[] {
  // Deduplicate by command content
  const seen = new Set<string>();
  const unique: ExtractedCommand[] = [];

  for (const cmd of commands) {
    const normalized = cmd.command.trim().toLowerCase();
    if (!seen.has(normalized) && cmd.command.length >= 5) {
      seen.add(normalized);
      unique.push(cmd);
    }
  }

  return unique.slice(0, 50).map((cmd) => ({
    content: cmd.command,
    category: cmd.commandType,
    importance: estimateImportance(cmd),
    difficulty: estimateDifficulty(cmd.command),
    syntaxType: cmd.commandType,
    hint: cmd.context || `Command from ${cmd.sourceFile}`,
  }));
}

function estimateImportance(cmd: ExtractedCommand): number {
  const command = cmd.command.toLowerCase();

  // High importance commands
  if (
    command.includes('git commit') ||
    command.includes('git push') ||
    command.includes('npm install') ||
    command.includes('npm run') ||
    command.includes('docker build') ||
    command.includes('docker-compose up')
  ) {
    return 8;
  }

  // Medium importance
  if (
    command.startsWith('git ') ||
    command.startsWith('npm ') ||
    command.startsWith('docker ')
  ) {
    return 6;
  }

  return 5;
}

function estimateDifficulty(command: string): 'beginner' | 'intermediate' | 'advanced' {
  if (command.length > 120 || command.includes('|') || command.includes('&&')) {
    return 'advanced';
  }
  if (command.length > 60) {
    return 'intermediate';
  }
  return 'beginner';
}
