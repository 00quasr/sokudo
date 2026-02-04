import { z } from 'zod';

/**
 * Represents a single parsed challenge from imported text.
 */
export interface ParsedChallenge {
  name: string;
  content: string;
}

/**
 * Result of parsing imported text into challenges.
 */
export interface ParseResult {
  challenges: ParsedChallenge[];
  skippedLines: number;
}

/**
 * Regex matching bash history line number prefixes (e.g., "  123  " or "1234  ").
 */
const HISTORY_LINE_PREFIX = /^\s*\d+\s{2,}/;

/**
 * Regex matching common shell comment lines.
 */
const COMMENT_LINE = /^\s*#/;

/**
 * Lines that are too short to be useful typing practice.
 */
const MIN_LINE_LENGTH = 2;

/**
 * Maximum number of challenges from a single import.
 */
export const MAX_IMPORT_CHALLENGES = 50;

/**
 * Strip bash history line number prefixes from a line.
 * Handles formats like "  123  git status" or "1234  ls -la".
 */
function stripHistoryPrefix(line: string): string {
  return line.replace(HISTORY_LINE_PREFIX, '');
}

/**
 * Determine if a line should be skipped during import.
 * Skips empty lines, comments, and lines that are too short after cleanup.
 */
function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < MIN_LINE_LENGTH) return true;
  if (COMMENT_LINE.test(trimmed)) return true;
  return false;
}

/**
 * Generate a descriptive name for a challenge from its content.
 * Uses the first command/keyword in the line.
 */
function generateChallengeName(content: string, index: number): string {
  const trimmed = content.trim();
  const firstWord = trimmed.split(/\s+/)[0];

  // Truncate if the first word is too long
  const label = firstWord.length > 30 ? firstWord.slice(0, 30) + '...' : firstWord;

  return `Imported: ${label} (#${index + 1})`;
}

/**
 * Detect if the input looks like a multi-line block (e.g., a function definition,
 * multi-line alias, or heredoc) rather than individual commands.
 */
function isMultiLineBlock(text: string): boolean {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;

  // Check for function definitions, heredocs, or continued lines
  const hasBlockIndicators = lines.some(
    (line) =>
      /\{\s*$/.test(line.trim()) ||
      /<<[-']?\w+/.test(line) ||
      /\\\s*$/.test(line.trim()) ||
      /^\s+(then|else|fi|do|done|esac)\b/.test(line) ||
      /;\s*then\s*$/.test(line.trim()) ||
      /;\s*do\s*$/.test(line.trim())
  );

  return hasBlockIndicators;
}

/**
 * Parse raw text input into individual challenge entries.
 *
 * Handles:
 * - Shell history output (with line number prefixes)
 * - .bashrc/.zshrc snippets (aliases, exports, functions)
 * - Plain command lists (one per line)
 * - Multi-line blocks (kept as single challenge)
 *
 * @param text - Raw text pasted by the user
 * @param mode - How to split the text: 'lines' splits each line into a challenge,
 *               'block' keeps the entire text as one challenge
 * @returns ParseResult with parsed challenges and count of skipped lines
 */
export function parseShellText(
  text: string,
  mode: 'lines' | 'block' = 'lines'
): ParseResult {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return { challenges: [], skippedLines: 0 };
  }

  if (mode === 'block') {
    return {
      challenges: [
        {
          name: 'Imported block',
          content: trimmedText,
        },
      ],
      skippedLines: 0,
    };
  }

  // Auto-detect multi-line blocks
  if (isMultiLineBlock(trimmedText)) {
    return {
      challenges: [
        {
          name: 'Imported block',
          content: trimmedText,
        },
      ],
      skippedLines: 0,
    };
  }

  const rawLines = trimmedText.split('\n');
  const challenges: ParsedChallenge[] = [];
  let skippedLines = 0;
  const seen = new Set<string>();

  for (const rawLine of rawLines) {
    const cleaned = stripHistoryPrefix(rawLine).trim();

    if (shouldSkipLine(cleaned)) {
      if (rawLine.trim().length > 0) {
        skippedLines++;
      }
      continue;
    }

    // Deduplicate
    if (seen.has(cleaned)) {
      skippedLines++;
      continue;
    }
    seen.add(cleaned);

    if (challenges.length >= MAX_IMPORT_CHALLENGES) {
      skippedLines++;
      continue;
    }

    challenges.push({
      name: generateChallengeName(cleaned, challenges.length),
      content: cleaned,
    });
  }

  return { challenges, skippedLines };
}

/**
 * Zod schema for import form validation.
 */
export const importTextSchema = z.object({
  text: z
    .string()
    .min(1, 'Paste some text to import.')
    .max(50000, 'Input text is too large. Maximum 50,000 characters.'),
  mode: z.enum(['lines', 'block']).default('lines'),
});
