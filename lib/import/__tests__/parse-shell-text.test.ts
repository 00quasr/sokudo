import { describe, it, expect } from 'vitest';
import {
  parseShellText,
  MAX_IMPORT_CHALLENGES,
  importTextSchema,
} from '../parse-shell-text';

describe('parseShellText', () => {
  describe('basic line parsing', () => {
    it('should parse single command', () => {
      const result = parseShellText('git status');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[0].name).toContain('git');
    });

    it('should parse multiple commands on separate lines', () => {
      const text = 'git add .\ngit commit -m "update"\ngit push';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(3);
      expect(result.challenges[0].content).toBe('git add .');
      expect(result.challenges[1].content).toBe('git commit -m "update"');
      expect(result.challenges[2].content).toBe('git push');
    });

    it('should return empty for empty input', () => {
      const result = parseShellText('');
      expect(result.challenges).toHaveLength(0);
      expect(result.skippedLines).toBe(0);
    });

    it('should return empty for whitespace-only input', () => {
      const result = parseShellText('   \n  \n   ');
      expect(result.challenges).toHaveLength(0);
    });
  });

  describe('shell history format', () => {
    it('should strip history line number prefixes', () => {
      const text = '  123  git status\n  124  git add .\n  125  git commit -m "fix"';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(3);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[1].content).toBe('git add .');
      expect(result.challenges[2].content).toBe('git commit -m "fix"');
    });

    it('should handle history with no leading spaces', () => {
      const text = '1234  ls -la\n1235  pwd';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.challenges[0].content).toBe('ls -la');
      expect(result.challenges[1].content).toBe('pwd');
    });

    it('should handle mixed history and plain lines', () => {
      const text = '  100  git status\ndocker ps\n  102  npm install';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(3);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[1].content).toBe('docker ps');
      expect(result.challenges[2].content).toBe('npm install');
    });
  });

  describe('comment filtering', () => {
    it('should skip comment lines', () => {
      const text = '# This is a comment\ngit status\n# Another comment\ngit push';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[1].content).toBe('git push');
      expect(result.skippedLines).toBe(2);
    });

    it('should skip lines with leading whitespace before #', () => {
      const text = '  # indented comment\ngit status';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(1);
      expect(result.skippedLines).toBe(1);
    });
  });

  describe('deduplication', () => {
    it('should remove duplicate lines', () => {
      const text = 'git status\ngit add .\ngit status\ngit push\ngit add .';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(3);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[1].content).toBe('git add .');
      expect(result.challenges[2].content).toBe('git push');
      expect(result.skippedLines).toBe(2);
    });
  });

  describe('short line filtering', () => {
    it('should skip single-character lines', () => {
      const text = 'a\ngit status\nb';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.skippedLines).toBe(2);
    });

    it('should keep two-character lines', () => {
      const text = 'ls\ngit status';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.challenges[0].content).toBe('ls');
    });
  });

  describe('empty line handling', () => {
    it('should skip empty lines without counting them as skipped', () => {
      const text = 'git status\n\n\ngit push';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.skippedLines).toBe(0);
    });
  });

  describe('max import limit', () => {
    it('should limit to MAX_IMPORT_CHALLENGES', () => {
      const lines = Array.from({ length: 60 }, (_, i) => `command-${i}`);
      const result = parseShellText(lines.join('\n'));
      expect(result.challenges).toHaveLength(MAX_IMPORT_CHALLENGES);
      expect(result.skippedLines).toBe(10);
    });
  });

  describe('challenge naming', () => {
    it('should generate names with the first command word', () => {
      const result = parseShellText('git add . && git commit -m "fix"');
      expect(result.challenges[0].name).toContain('git');
      expect(result.challenges[0].name).toContain('#1');
    });

    it('should truncate long first words in names', () => {
      const longWord = 'a'.repeat(40);
      const result = parseShellText(longWord);
      expect(result.challenges[0].name.length).toBeLessThan(60);
    });

    it('should number challenges sequentially', () => {
      const text = 'git status\ndocker ps\nnpm install';
      const result = parseShellText(text);
      expect(result.challenges[0].name).toContain('#1');
      expect(result.challenges[1].name).toContain('#2');
      expect(result.challenges[2].name).toContain('#3');
    });
  });

  describe('block mode', () => {
    it('should keep entire text as one challenge', () => {
      const text = 'git add .\ngit commit -m "update"\ngit push';
      const result = parseShellText(text, 'block');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].content).toBe(text);
      expect(result.challenges[0].name).toBe('Imported block');
      expect(result.skippedLines).toBe(0);
    });

    it('should trim block content', () => {
      const text = '  \n  git status  \n  ';
      const result = parseShellText(text, 'block');
      expect(result.challenges[0].content).toBe('git status');
    });
  });

  describe('multi-line block auto-detection', () => {
    it('should detect function definitions as blocks', () => {
      const text = 'function greet() {\n  echo "hello"\n}';
      const result = parseShellText(text, 'lines');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].content).toBe(text);
    });

    it('should detect line continuations as blocks', () => {
      const text = 'docker run \\\n  -p 8080:80 \\\n  -v ./data:/data \\\n  nginx';
      const result = parseShellText(text, 'lines');
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].content).toBe(text);
    });

    it('should detect heredocs as blocks', () => {
      const text = 'cat <<EOF\nhello world\nEOF';
      const result = parseShellText(text, 'lines');
      expect(result.challenges).toHaveLength(1);
    });

    it('should detect if/then/fi blocks', () => {
      const text = 'if [ -f .env ]; then\n  source .env\nfi';
      const result = parseShellText(text, 'lines');
      expect(result.challenges).toHaveLength(1);
    });

    it('should not detect plain command lists as blocks', () => {
      const text = 'git status\ngit add .\ngit push';
      const result = parseShellText(text, 'lines');
      expect(result.challenges).toHaveLength(3);
    });
  });

  describe('bashrc-style content', () => {
    it('should parse alias lines', () => {
      const text = "alias ll='ls -la'\nalias gs='git status'";
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.challenges[0].content).toBe("alias ll='ls -la'");
      expect(result.challenges[1].content).toBe("alias gs='git status'");
    });

    it('should parse export lines', () => {
      const text = 'export PATH="$HOME/bin:$PATH"\nexport EDITOR=vim';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
    });

    it('should skip comments in bashrc content', () => {
      const text = '# Path configuration\nexport PATH="$HOME/bin:$PATH"\n# Editor\nexport EDITOR=vim';
      const result = parseShellText(text);
      expect(result.challenges).toHaveLength(2);
      expect(result.skippedLines).toBe(2);
    });
  });

  describe('whitespace trimming', () => {
    it('should trim leading and trailing whitespace from lines', () => {
      const text = '  git status  \n  docker ps  ';
      const result = parseShellText(text);
      expect(result.challenges[0].content).toBe('git status');
      expect(result.challenges[1].content).toBe('docker ps');
    });
  });
});

describe('importTextSchema', () => {
  it('should accept valid text', () => {
    const result = importTextSchema.safeParse({ text: 'git status', mode: 'lines' });
    expect(result.success).toBe(true);
  });

  it('should reject empty text', () => {
    const result = importTextSchema.safeParse({ text: '', mode: 'lines' });
    expect(result.success).toBe(false);
  });

  it('should reject overly large text', () => {
    const result = importTextSchema.safeParse({ text: 'a'.repeat(50001), mode: 'lines' });
    expect(result.success).toBe(false);
  });

  it('should default mode to lines', () => {
    const result = importTextSchema.safeParse({ text: 'git status' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('lines');
    }
  });

  it('should accept block mode', () => {
    const result = importTextSchema.safeParse({ text: 'git status', mode: 'block' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid mode', () => {
    const result = importTextSchema.safeParse({ text: 'git status', mode: 'invalid' });
    expect(result.success).toBe(false);
  });
});
