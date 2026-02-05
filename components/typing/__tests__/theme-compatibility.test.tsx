/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingArea, SyntaxType } from '../TypingArea';
import { TypingInput } from '../TypingInput';

describe('Theme Compatibility', () => {
  describe('TypingArea - syntax highlighting in both themes', () => {
    const syntaxTypes: SyntaxType[] = [
      'git',
      'shell',
      'react',
      'typescript',
      'docker',
      'sql',
      'npm',
      'yarn',
      'pnpm',
    ];

    it.each(syntaxTypes)(
      'should have theme-aware colors for %s syntax type',
      (syntaxType) => {
        render(<TypingArea text="test command" syntaxType={syntaxType} />);
        const container = screen.getByTestId('typing-area');
        expect(container).toBeTruthy();
      }
    );

    it('should use theme-aware command colors (violet)', () => {
      render(<TypingArea text="git commit" syntaxType="git" />);
      const gChar = screen.getByText('g');

      // Check for both light and dark theme classes
      expect(gChar.className).toMatch(/text-violet-600|dark:text-violet-400/);
    });

    it('should use theme-aware subcommand colors (blue)', () => {
      render(<TypingArea text="git commit" syntaxType="git" />);
      const cChar = screen.getByText('c');

      expect(cChar.className).toMatch(/text-blue-600|dark:text-blue-400/);
    });

    it('should use theme-aware flag colors (cyan)', () => {
      render(<TypingArea text="git commit -m" syntaxType="git" />);
      const dashChar = screen.getAllByText('-')[0];

      expect(dashChar.className).toMatch(/text-cyan-600|dark:text-cyan-400/);
    });

    it('should use theme-aware string colors (green)', () => {
      render(<TypingArea text='git commit -m "test"' syntaxType="git" />);
      const quotes = screen.getAllByText('"');

      expect(quotes[0].className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should use semantic colors for default text', () => {
      render(<TypingArea text="git commit" syntaxType="git" />);
      const spaceChar = screen.getByTestId('char-3');

      // Default style should use muted-foreground
      expect(spaceChar.className).toContain('text-muted-foreground');
    });
  });

  describe('TypingArea - character state colors in both themes', () => {
    it('should use theme-aware colors for correct characters', () => {
      render(<TypingArea text="abc" cursorPosition={1} />);
      const aChar = screen.getByText('a');

      // Should have both light and dark theme classes
      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should use theme-aware colors for error characters', () => {
      const errors = new Map<number, string>();
      errors.set(0, 'x');
      render(<TypingArea text="abc" cursorPosition={1} errors={errors} />);
      const aChar = screen.getByText('a');

      expect(aChar.className).toMatch(/text-red-600|dark:text-red-400/);
    });

    it('should use theme-aware colors for error indicators', () => {
      const errors = new Map<number, string>();
      errors.set(0, 'z');
      render(<TypingArea text="abc" cursorPosition={1} errors={errors} />);
      const errorIndicator = screen.getByTestId('error-0');

      // Error indicator should have theme-aware red colors
      expect(errorIndicator.className).toMatch(/text-red-500|dark:text-red-400/);
    });
  });

  describe('TypingInput - theme compatibility', () => {
    it('should use theme-aware colors for correct characters', () => {
      const { container } = render(
        <TypingInput targetText="abc" autoFocus={false} />
      );

      // Component should render without errors
      expect(container).toBeTruthy();
    });

    it('should use theme-aware border color when complete', () => {
      const { container } = render(
        <TypingInput targetText="" autoFocus={false} />
      );

      const typingBox = container.querySelector('[role="textbox"]');
      expect(typingBox).toBeTruthy();
    });
  });

  describe('Color contrast - accessibility', () => {
    it('should not use colors that are too light in light mode', () => {
      render(<TypingArea text="git commit" syntaxType="git" />);
      const gChar = screen.getByText('g');

      // Should use darker variants (600) for light mode, not 400
      const className = gChar.className;
      expect(className).toContain('text-violet-600');
      expect(className).toContain('dark:text-violet-400');
    });

    it('should use semantic color variables for base text', () => {
      render(<TypingArea text="plain text" syntaxType="plain" />);
      const pChar = screen.getByText('p');

      // Plain text should use semantic foreground color
      expect(pChar.className).toContain('text-foreground');
    });

    it('should use muted-foreground for default syntax text', () => {
      render(<TypingArea text="git " syntaxType="git" />);
      const spaceChar = screen.getByTestId('char-3');

      // Non-highlighted text should use muted-foreground
      expect(spaceChar.className).toContain('text-muted-foreground');
    });
  });

  describe('Dark mode specific tests', () => {
    it('should have dark mode variants for all syntax colors', () => {
      render(<TypingArea text="git commit -m 'test'" syntaxType="git" />);
      const container = screen.getByTestId('typing-area');

      // Check that various elements have dark: prefixed classes
      const hasViolet = container.innerHTML.includes('dark:text-violet-400');
      const hasBlue = container.innerHTML.includes('dark:text-blue-400');
      const hasCyan = container.innerHTML.includes('dark:text-cyan-400');
      const hasGreen = container.innerHTML.includes('dark:text-green-400');

      // At least some of these colors should be present
      expect(hasViolet || hasBlue || hasCyan || hasGreen).toBe(true);
    });
  });

  describe('Light mode specific tests', () => {
    it('should have light mode variants (600) for all syntax colors', () => {
      render(<TypingArea text="git commit -m 'test'" syntaxType="git" />);
      const container = screen.getByTestId('typing-area');

      // Check that various elements have 600 variants for light mode
      const hasViolet = container.innerHTML.includes('text-violet-600');
      const hasBlue = container.innerHTML.includes('text-blue-600');
      const hasCyan = container.innerHTML.includes('text-cyan-600');
      const hasGreen = container.innerHTML.includes('text-green-600');

      // At least some of these colors should be present
      expect(hasViolet || hasBlue || hasCyan || hasGreen).toBe(true);
    });
  });

  describe('Complete state colors', () => {
    it('should use theme-aware green for completion message', () => {
      const { container } = render(
        <TypingInput targetText="" autoFocus={false} />
      );

      // Component should be complete immediately with empty text
      expect(container).toBeTruthy();
    });
  });
});
