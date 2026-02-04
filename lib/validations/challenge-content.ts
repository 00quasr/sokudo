import { z } from 'zod';

const MIN_CONTENT_LENGTH = 2;
const MAX_CONTENT_LENGTH = 5000;
const MAX_LINE_LENGTH = 200;

/**
 * Regex matching control characters that are not typeable on a standard keyboard.
 * Allows common whitespace (tab \t, newline \n, carriage return \r).
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

/**
 * Bracket/quote pairs used for balance checking.
 */
const OPEN_BRACKETS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSE_BRACKETS: Record<string, string> = {
  ')': '(',
  ']': '[',
  '}': '{',
};

export interface ContentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check for untypeable control characters in the content.
 */
function checkControlCharacters(content: string): string | null {
  if (CONTROL_CHAR_REGEX.test(content)) {
    return 'Content contains untypeable control characters. Only printable characters, tabs, and newlines are allowed.';
  }
  return null;
}

/**
 * Check that no single line exceeds the maximum line length.
 */
function checkLineLength(content: string): string | null {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > MAX_LINE_LENGTH) {
      return `Line ${i + 1} exceeds the maximum length of ${MAX_LINE_LENGTH} characters (${lines[i].length} chars). Break long lines for better typing practice.`;
    }
  }
  return null;
}

/**
 * Check that brackets (), [], {} are balanced in the content.
 * Uses a stack-based approach that handles nesting.
 * Skips characters inside string literals (single and double quoted).
 */
function checkBracketBalance(content: string): string | null {
  const stack: { char: string; pos: number }[] = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let prevChar = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const isEscaped = prevChar === '\\';

    if (!isEscaped) {
      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
      }
    }

    prevChar = isEscaped ? '' : char;

    if (inSingleQuote || inDoubleQuote || inBacktick) {
      continue;
    }

    if (char in OPEN_BRACKETS) {
      stack.push({ char, pos: i });
    } else if (char in CLOSE_BRACKETS) {
      const expected = CLOSE_BRACKETS[char];
      if (stack.length === 0) {
        return `Unmatched closing '${char}' at position ${i + 1}.`;
      }
      const top = stack[stack.length - 1];
      if (top.char !== expected) {
        return `Mismatched brackets: expected closing for '${top.char}' (position ${top.pos + 1}) but found '${char}' at position ${i + 1}.`;
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return `Unclosed '${unclosed.char}' at position ${unclosed.pos + 1}.`;
  }

  return null;
}

/**
 * Check that the content doesn't consist only of whitespace.
 */
function checkNotWhitespaceOnly(content: string): string | null {
  if (content.trim().length === 0) {
    return 'Content cannot be only whitespace.';
  }
  return null;
}

/**
 * Validate challenge content and return structured results with errors and warnings.
 */
export function validateChallengeContent(content: string): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const whitespaceError = checkNotWhitespaceOnly(content);
  if (whitespaceError) {
    errors.push(whitespaceError);
    return { valid: false, errors, warnings };
  }

  const controlError = checkControlCharacters(content);
  if (controlError) {
    errors.push(controlError);
  }

  const lineLengthError = checkLineLength(content);
  if (lineLengthError) {
    warnings.push(lineLengthError);
  }

  const bracketError = checkBracketBalance(content);
  if (bracketError) {
    warnings.push(bracketError);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Zod refinement for challenge content that validates syntax.
 * Returns the first error message, or the first warning if no errors.
 * Warnings are non-blocking - only hard errors cause validation failure.
 */
export const challengeContentSchema = z
  .string()
  .min(MIN_CONTENT_LENGTH, `Content must be at least ${MIN_CONTENT_LENGTH} characters.`)
  .max(MAX_CONTENT_LENGTH, `Content must be ${MAX_CONTENT_LENGTH} characters or less.`)
  .refine(
    (val) => val.trim().length > 0,
    { message: 'Content cannot be only whitespace.' }
  )
  .refine(
    (val) => !CONTROL_CHAR_REGEX.test(val),
    { message: 'Content contains untypeable control characters. Only printable characters, tabs, and newlines are allowed.' }
  );

export {
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_LINE_LENGTH,
};
