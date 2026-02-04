import { describe, it, expect } from 'vitest';
import {
  validateChallengeContent,
  challengeContentSchema,
  MIN_CONTENT_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_LINE_LENGTH,
} from '../challenge-content';

describe('validateChallengeContent', () => {
  describe('valid content', () => {
    it('should accept simple command content', () => {
      const result = validateChallengeContent('git status');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept multi-line content', () => {
      const content = 'git add .\ngit commit -m "initial commit"\ngit push';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept content with tabs', () => {
      const content = 'function hello() {\n\treturn "world";\n}';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept content with balanced brackets', () => {
      const content = 'const arr = [1, 2, 3].map((x) => ({ value: x }));';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept content with brackets inside strings', () => {
      const content = 'console.log("hello (world]")';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept content with single-quoted strings containing brackets', () => {
      const content = "const msg = 'missing [bracket}';";
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept content with backtick strings containing brackets', () => {
      const content = 'const msg = `template with (unbalanced}`;';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept content with escaped quotes', () => {
      const content = 'echo "say \\"hello\\""';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
    });

    it('should accept typical React JSX content', () => {
      const content = 'const App = () => {\n  return (\n    <div className="app">\n      <h1>Hello</h1>\n    </div>\n  );\n};';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
    });

    it('should accept SQL content', () => {
      const content = 'SELECT * FROM users WHERE id = 1;';
      const result = validateChallengeContent(content);
      expect(result.valid).toBe(true);
    });
  });

  describe('whitespace-only content', () => {
    it('should reject empty string after trim', () => {
      const result = validateChallengeContent('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content cannot be only whitespace.');
    });

    it('should reject tabs and newlines only', () => {
      const result = validateChallengeContent('\t\n\t\n');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content cannot be only whitespace.');
    });
  });

  describe('control characters', () => {
    it('should reject content with null bytes', () => {
      const result = validateChallengeContent('hello\x00world');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('control characters');
    });

    it('should reject content with bell character', () => {
      const result = validateChallengeContent('alert\x07beep');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('control characters');
    });

    it('should reject content with backspace character', () => {
      const result = validateChallengeContent('test\x08back');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('control characters');
    });

    it('should reject content with escape character', () => {
      const result = validateChallengeContent('test\x1Besc');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('control characters');
    });

    it('should reject content with DEL character', () => {
      const result = validateChallengeContent('test\x7Fdel');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('control characters');
    });

    it('should allow tab characters', () => {
      const result = validateChallengeContent('hello\tworld');
      expect(result.valid).toBe(true);
    });

    it('should allow newline characters', () => {
      const result = validateChallengeContent('hello\nworld');
      expect(result.valid).toBe(true);
    });

    it('should allow carriage return characters', () => {
      const result = validateChallengeContent('hello\r\nworld');
      expect(result.valid).toBe(true);
    });
  });

  describe('line length warnings', () => {
    it('should warn about lines exceeding max length', () => {
      const longLine = 'a'.repeat(MAX_LINE_LENGTH + 1);
      const result = validateChallengeContent(longLine);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain(`Line 1 exceeds the maximum length of ${MAX_LINE_LENGTH}`);
    });

    it('should not warn about lines at exactly max length', () => {
      const exactLine = 'a'.repeat(MAX_LINE_LENGTH);
      const result = validateChallengeContent(exactLine);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should identify the correct line number for long lines', () => {
      const content = 'short line\n' + 'b'.repeat(MAX_LINE_LENGTH + 1);
      const result = validateChallengeContent(content);
      expect(result.warnings[0]).toContain('Line 2');
    });
  });

  describe('bracket balance warnings', () => {
    it('should warn about unclosed parenthesis', () => {
      const result = validateChallengeContent('function(a, b');
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("Unclosed '('");
    });

    it('should warn about unmatched closing bracket', () => {
      const result = validateChallengeContent('array]');
      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain("Unmatched closing ']'");
    });

    it('should warn about mismatched brackets', () => {
      const result = validateChallengeContent('(value]');
      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('Mismatched brackets');
    });

    it('should warn about unclosed curly brace', () => {
      const result = validateChallengeContent('if (true) {');
      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain("Unclosed '{'");
    });

    it('should accept nested balanced brackets', () => {
      const result = validateChallengeContent('arr.map((x) => [x, {y: x}])');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('challengeContentSchema', () => {
  it('should reject content shorter than minimum length', () => {
    const result = challengeContentSchema.safeParse('a');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(`at least ${MIN_CONTENT_LENGTH}`);
    }
  });

  it('should reject content exceeding maximum length', () => {
    const result = challengeContentSchema.safeParse('a'.repeat(MAX_CONTENT_LENGTH + 1));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(`${MAX_CONTENT_LENGTH} characters or less`);
    }
  });

  it('should reject whitespace-only content', () => {
    const result = challengeContentSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('should reject content with control characters', () => {
    const result = challengeContentSchema.safeParse('hello\x00world');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('control characters');
    }
  });

  it('should accept valid content', () => {
    const result = challengeContentSchema.safeParse('git status');
    expect(result.success).toBe(true);
  });

  it('should accept content at minimum length', () => {
    const result = challengeContentSchema.safeParse('ab');
    expect(result.success).toBe(true);
  });

  it('should accept content at maximum length', () => {
    const result = challengeContentSchema.safeParse('a'.repeat(MAX_CONTENT_LENGTH));
    expect(result.success).toBe(true);
  });
});
