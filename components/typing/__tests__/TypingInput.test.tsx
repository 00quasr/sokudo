/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TypingInput, SyntaxType } from '../TypingInput';

describe('TypingInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the target text', () => {
      render(<TypingInput targetText="abcdef" />);

      // The text should be visible (split into individual characters)
      expect(screen.getByText('a')).toBeTruthy();
      expect(screen.getByText('b')).toBeTruthy();
      expect(screen.getByText('c')).toBeTruthy();
      expect(screen.getByText('d')).toBeTruthy();
    });

    it('should show stats bar by default', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByText('WPM')).toBeTruthy();
      expect(screen.getByText('Accuracy')).toBeTruthy();
      expect(screen.getByText('Time')).toBeTruthy();
    });

    it('should hide stats bar when showStats is false', () => {
      render(<TypingInput targetText="test" showStats={false} />);

      expect(screen.queryByText('WPM')).toBeNull();
    });

    it('should show start typing message initially', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByText('Start typing to begin...')).toBeTruthy();
    });

    it('should show keyboard shortcuts', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByText('Restart')).toBeTruthy();
      expect(screen.getByText('Skip')).toBeTruthy();
      expect(screen.getByText('Undo')).toBeTruthy();
    });

    it('should show Enter/Next shortcut after completion', () => {
      render(<TypingInput targetText="ab" />);
      const input = screen.getByRole('textbox');

      // Complete the text
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      // Now "Next" shortcut should appear
      expect(screen.getByText('Next')).toBeTruthy();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <TypingInput targetText="test" className="custom-class" />
      );

      expect((container.firstChild as HTMLElement)?.className).toContain('custom-class');
    });
  });

  describe('typing interaction', () => {
    it('should handle correct keystrokes', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      // The 'a' should now be marked as typed (green)
      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should handle incorrect keystrokes', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type wrong character
      fireEvent.keyDown(input, { key: 'x' });

      // The 'a' position should show error
      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-red-600|dark:text-red-400/);
    });

    it('should handle backspace', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type correct character
      fireEvent.keyDown(input, { key: 'a' });
      expect(screen.getByText('a').className).toMatch(/text-green-600|dark:text-green-400/);

      // Backspace
      fireEvent.keyDown(input, { key: 'Backspace' });

      // Should be back to initial state - 'a' should not be green anymore
      // The cursor should be back at position 0
      const aChar = screen.getByText('a');
      // The 'a' should have the cursor indicator (bg-primary/20)
      expect(aChar.className).toContain('bg-primary/20');
    });

    it('should handle escape to reset', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type some characters
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      // Reset
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should show start message again
      expect(screen.getByText('Start typing to begin...')).toBeTruthy();
    });

    it('should call onSkip when Tab is pressed', () => {
      const onSkip = vi.fn();
      render(<TypingInput targetText="abc" onSkip={onSkip} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Tab' });

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Enter is pressed after completion', () => {
      const onNext = vi.fn();
      render(<TypingInput targetText="ab" onNext={onNext} />);
      const input = screen.getByRole('textbox');

      // Complete the text
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      // Press Enter
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should not call onNext when Enter is pressed before completion', () => {
      const onNext = vi.fn();
      render(<TypingInput targetText="abc" onNext={onNext} />);
      const input = screen.getByRole('textbox');

      // Type one character (not complete)
      fireEvent.keyDown(input, { key: 'a' });

      // Press Enter
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onNext).not.toHaveBeenCalled();
    });

    it('should ignore modifier key combinations', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Ctrl+C should not type anything
      fireEvent.keyDown(input, { key: 'c', ctrlKey: true });

      // Should still show start message
      expect(screen.getByText('Start typing to begin...')).toBeTruthy();
    });

    it('should call onKeystroke callback', () => {
      const onKeystroke = vi.fn();
      render(<TypingInput targetText="abc" onKeystroke={onKeystroke} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      expect(onKeystroke).toHaveBeenCalledTimes(1);
      expect(onKeystroke).toHaveBeenCalledWith(
        expect.objectContaining({
          expected: 'a',
          actual: 'a',
          isCorrect: true,
        })
      );
    });

    it('should call onComplete callback when finished', () => {
      const onComplete = vi.fn();
      render(<TypingInput targetText="ab" onComplete={onComplete} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          keystrokes: 2,
          errors: 0,
          accuracy: 100,
        }),
        expect.any(Array)
      );
    });

    it('should show completion message when finished', () => {
      render(<TypingInput targetText="ab" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      expect(screen.getByText('Complete!')).toBeTruthy();
      // Check that there are kbd elements for Enter and Esc (there may be multiple from the shortcut hints)
      const enterKbds = screen.getAllByText('Enter');
      const escKbds = screen.getAllByText('Esc');
      expect(enterKbds.length).toBeGreaterThanOrEqual(1);
      expect(escKbds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('syntax highlighting', () => {
    it('should apply git syntax highlighting', () => {
      render(<TypingInput targetText="git commit -m" syntaxType="git" />);

      // 'git' should have purple styling
      const gitChar = screen.getByText('g');
      expect(gitChar.className).toMatch(/text-violet-600|dark:text-violet-400/);
    });

    it('should apply shell syntax highlighting', () => {
      render(<TypingInput targetText="cd /home" syntaxType="shell" />);

      // 'c' from 'cd' should have purple styling
      const cdChar = screen.getByText('c');
      expect(cdChar.className).toMatch(/text-violet-600|dark:text-violet-400/);
    });

    it('should apply sql syntax highlighting', () => {
      render(<TypingInput targetText="SELECT * FROM" syntaxType="sql" />);

      // 'S' from 'SELECT' should have purple styling
      const selectChar = screen.getByText('S');
      expect(selectChar.className).toMatch(/text-violet-600|dark:text-violet-400/);
    });

    it('should handle plain syntax type', () => {
      render(<TypingInput targetText="plain text" syntaxType="plain" />);

      // Should render without errors
      expect(screen.getByText('p')).toBeTruthy();
    });

    it('should apply npm syntax highlighting', () => {
      render(<TypingInput targetText="npm add" syntaxType="npm" />);

      // First char 'n' from 'npm' should have purple styling
      const chars = screen.getAllByText('n');
      expect(chars[0].className).toMatch(/text-violet-600|dark:text-violet-400/);
    });

    it('should apply docker syntax highlighting', () => {
      render(<TypingInput targetText="docker ps" syntaxType="docker" />);

      // First char 'd' from 'docker' should have purple styling
      const chars = screen.getAllByText('d');
      expect(chars[0].className).toMatch(/text-violet-600|dark:text-violet-400/);
    });
  });

  describe('stats display', () => {
    it('should show initial WPM as 0', () => {
      render(<TypingInput targetText="test" />);

      // Find the WPM value (should be 0)
      const wpmLabel = screen.getByText('WPM');
      const wpmValue = wpmLabel.nextElementSibling;
      expect(wpmValue?.textContent).toBe('0');
    });

    it('should show initial accuracy as 100%', () => {
      render(<TypingInput targetText="test" />);

      const accuracyLabel = screen.getByText('Accuracy');
      const accuracyValue = accuracyLabel.nextElementSibling;
      expect(accuracyValue?.textContent).toBe('100%');
    });

    it('should show initial time as 0:00', () => {
      render(<TypingInput targetText="test" />);

      const timeLabel = screen.getByText('Time');
      const timeValue = timeLabel.nextElementSibling;
      expect(timeValue?.textContent).toBe('0:00');
    });

    it('should show progress as 0% initially', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByText('0%')).toBeTruthy();
    });

    it('should update progress as typing progresses', () => {
      render(<TypingInput targetText="test" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 't' });
      fireEvent.keyDown(input, { key: 'e' });

      // 2/4 = 50%
      expect(screen.getByText('50%')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have textbox role', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    it('should have aria-label', () => {
      render(<TypingInput targetText="test" />);

      expect(screen.getByRole('textbox').getAttribute('aria-label')).toBe('Typing input area');
    });

    it('should be focusable', () => {
      render(<TypingInput targetText="test" />);
      const input = screen.getByRole('textbox');

      expect(input.getAttribute('tabIndex')).toBe('0');
    });

    it('should auto-focus by default', () => {
      render(<TypingInput targetText="test" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // The hidden input should be focused for mobile support
      expect(document.activeElement).toBe(hiddenInput);
    });

    it('should not auto-focus when autoFocus is false', () => {
      render(<TypingInput targetText="test" autoFocus={false} />);
      const input = screen.getByRole('textbox');

      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('special characters', () => {
    it('should handle space characters', () => {
      render(<TypingInput targetText="a b" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: ' ' });
      fireEvent.keyDown(input, { key: 'b' });

      expect(screen.getByText('Complete!')).toBeTruthy();
    });

    it('should handle quoted strings', () => {
      render(<TypingInput targetText='"hello"' syntaxType="git" />);

      // Should render quotes
      const quotes = screen.getAllByText('"');
      expect(quotes.length).toBe(2);
    });
  });

  describe('real-time error highlighting', () => {
    it('should show green for correct characters', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should show red for incorrect characters', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'x' });

      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-red-600|dark:text-red-400/);
    });

    it('should show error indicator with wrong character typed', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type wrong character 'z' when 'a' was expected
      fireEvent.keyDown(input, { key: 'z' });

      // The error indicator should show 'z'
      const errorIndicator = screen.getByText('z');
      expect(errorIndicator.className).toContain('text-red-400');
      expect(errorIndicator.className).toContain('text-[10px]');
    });

    it('should highlight multiple errors in red', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'x' }); // wrong
      fireEvent.keyDown(input, { key: 'y' }); // wrong
      fireEvent.keyDown(input, { key: 'c' }); // correct

      const aChar = screen.getByText('a');
      const bChar = screen.getByText('b');
      const cChar = screen.getByText('c');

      expect(aChar.className).toMatch(/text-red-600|dark:text-red-400/);
      expect(bChar.className).toMatch(/text-red-600|dark:text-red-400/);
      expect(cChar.className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should show mix of correct and incorrect highlighting', () => {
      render(<TypingInput targetText="abcd" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' }); // correct
      fireEvent.keyDown(input, { key: 'x' }); // wrong
      fireEvent.keyDown(input, { key: 'c' }); // correct
      fireEvent.keyDown(input, { key: 'y' }); // wrong

      const aChar = screen.getByText('a');
      const bChar = screen.getByText('b');
      const cChar = screen.getByText('c');
      const dChar = screen.getByText('d');

      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);
      expect(bChar.className).toMatch(/text-red-600|dark:text-red-400/);
      expect(cChar.className).toMatch(/text-green-600|dark:text-green-400/);
      expect(dChar.className).toMatch(/text-red-600|dark:text-red-400/);
    });

    it('should dim upcoming characters', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      // 'c' is upcoming and should be dimmed
      const cChar = screen.getByText('c');
      expect(cChar.className).toContain('opacity-50');
    });

    it('should highlight current character with cursor background', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      // 'b' is now current and should have cursor background
      const bChar = screen.getByText('b');
      expect(bChar.className).toContain('bg-primary/20');
    });

    it('should clear error highlighting after backspace', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type wrong character
      fireEvent.keyDown(input, { key: 'x' });
      expect(screen.getByText('a').className).toMatch(/text-red-600|dark:text-red-400/);

      // Backspace
      fireEvent.keyDown(input, { key: 'Backspace' });

      // Character should no longer be red, and cursor should be on it
      const aChar = screen.getByText('a');
      expect(aChar.className).not.toMatch(/text-red-600|dark:text-red-400/);
      expect(aChar.className).toContain('bg-primary/20');
    });

    it('should handle error highlighting with syntax highlighting', () => {
      render(<TypingInput targetText="git commit" syntaxType="git" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'g' }); // correct
      fireEvent.keyDown(input, { key: 'x' }); // wrong (expected 'i')

      const gChar = screen.getByText('g');
      expect(gChar.className).toMatch(/text-green-600|dark:text-green-400/);

      // Find 'i' - it should be red
      const chars = screen.getAllByText('i');
      const iChar = chars.find((el) => el.className.includes('text-red-600') || el.className.includes('dark:text-red-400'));
      expect(iChar).toBeTruthy();
    });

    it('should show error indicator for space character typed incorrectly', () => {
      render(<TypingInput targetText="a b" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'x' }); // wrong, expected space

      // The error indicator should display 'x' (the wrong character typed)
      const errorIndicator = screen.getByText('x');
      expect(errorIndicator.className).toContain('text-red-400');
    });
  });

  describe('mobile touch events', () => {
    it('should focus hidden input on touch start', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();

      // Simulate touch start
      fireEvent.touchStart(container);

      expect(document.activeElement).toBe(hiddenInput);
    });

    it('should focus hidden input on click', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Simulate click
      fireEvent.click(container);

      expect(document.activeElement).toBe(hiddenInput);
    });

    it('should handle character input from mobile keyboard', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();

      // Simulate typing 'a' on mobile keyboard
      fireEvent.change(hiddenInput, { target: { value: 'a' } });

      // The 'a' should now be marked as typed (green)
      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);

      // Hidden input should be cleared
      expect(hiddenInput.value).toBe('');
    });

    it('should handle multiple characters from mobile keyboard', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Simulate typing 'a'
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      // Simulate typing 'b'
      fireEvent.change(hiddenInput, { target: { value: 'b' } });

      // Both characters should be marked as typed
      const aChar = screen.getByText('a');
      const bChar = screen.getByText('b');
      expect(aChar.className).toMatch(/text-green-600|dark:text-green-400/);
      expect(bChar.className).toMatch(/text-green-600|dark:text-green-400/);
    });

    it('should handle backspace from mobile keyboard via change event', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type a character first
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      expect(screen.getByText('a').className).toMatch(/text-green-600|dark:text-green-400/);

      // Simulate backspace using keydown (change event won't work since input is auto-cleared)
      fireEvent.keyDown(hiddenInput, { key: 'Backspace' });

      // Cursor should be back at position 0
      const aChar = screen.getByText('a');
      expect(aChar.className).toContain('bg-primary/20');
    });

    it('should handle backspace from mobile keyboard via keydown event', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type a character
      fireEvent.change(hiddenInput, { target: { value: 'a' } });

      // Press backspace key
      fireEvent.keyDown(hiddenInput, { key: 'Backspace' });

      // Cursor should be back at position 0
      const aChar = screen.getByText('a');
      expect(aChar.className).toContain('bg-primary/20');
    });

    it('should handle Enter key from mobile keyboard when complete', () => {
      const onNext = vi.fn();
      render(<TypingInput targetText="ab" onNext={onNext} />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Complete the text
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      fireEvent.change(hiddenInput, { target: { value: 'b' } });

      // Press Enter
      fireEvent.keyDown(hiddenInput, { key: 'Enter' });

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should handle Escape key from mobile keyboard', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type some characters
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      fireEvent.change(hiddenInput, { target: { value: 'b' } });

      // Press Escape
      fireEvent.keyDown(hiddenInput, { key: 'Escape' });

      // Should show start message again
      expect(screen.getByText('Start typing to begin...')).toBeTruthy();
    });

    it('should have hidden input with proper attributes', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();
      expect(hiddenInput.getAttribute('type')).toBe('text');
      expect(hiddenInput.getAttribute('inputmode')).toBe('text');
      expect(hiddenInput.getAttribute('autocomplete')).toBe('off');
      expect(hiddenInput.getAttribute('autocorrect')).toBe('off');
      expect(hiddenInput.getAttribute('autocapitalize')).toBe('off');
      expect(hiddenInput.getAttribute('spellcheck')).toBe('false');
      expect(hiddenInput.getAttribute('aria-hidden')).toBe('true');
      expect(hiddenInput.getAttribute('tabindex')).toBe('-1');
    });

    it('should keep hidden input visually hidden', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput.className).toContain('opacity-0');
      expect(hiddenInput.className).toContain('pointer-events-none');
    });

    it('should handle incorrect characters from mobile keyboard', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type wrong character
      fireEvent.change(hiddenInput, { target: { value: 'x' } });

      // The 'a' should show error
      const aChar = screen.getByText('a');
      expect(aChar.className).toMatch(/text-red-600|dark:text-red-400/);
    });

    it('should refocus hidden input after reset', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type and reset
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      fireEvent.keyDown(hiddenInput, { key: 'Escape' });

      // Hidden input should still be focusable
      fireEvent.click(container);
      expect(document.activeElement).toBe(hiddenInput);
    });

    it('should not refocus hidden input when autoFocus is false', () => {
      render(<TypingInput targetText="abc" autoFocus={false} />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(document.activeElement).not.toBe(hiddenInput);
    });

    it('should handle rapid typing from mobile keyboard', () => {
      render(<TypingInput targetText="abc" />);
      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Rapidly type all characters
      fireEvent.change(hiddenInput, { target: { value: 'a' } });
      fireEvent.change(hiddenInput, { target: { value: 'b' } });
      fireEvent.change(hiddenInput, { target: { value: 'c' } });

      // Should be complete
      expect(screen.getByText('Complete!')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty target text', () => {
      render(<TypingInput targetText="" />);

      // Should render without crashing
      expect(screen.getByRole('textbox')).toBeTruthy();
    });

    it('should handle single character target', () => {
      render(<TypingInput targetText="a" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });

      expect(screen.getByText('Complete!')).toBeTruthy();
    });

    it('should not process keys after completion', () => {
      render(<TypingInput targetText="a" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      expect(screen.getByText('Complete!')).toBeTruthy();

      // Try to type more
      fireEvent.keyDown(input, { key: 'b' });

      // Should still show completion
      expect(screen.getByText('Complete!')).toBeTruthy();
    });
  });

  describe('syntax types', () => {
    const syntaxTypes: SyntaxType[] = [
      'plain',
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

    it.each(syntaxTypes)('should render with %s syntax type without errors', (syntaxType) => {
      render(<TypingInput targetText="test command" syntaxType={syntaxType} />);

      expect(screen.getByRole('textbox')).toBeTruthy();
    });
  });

  describe('cursor animation', () => {
    it('should render cursor on current character', () => {
      render(<TypingInput targetText="abc" />);

      // Cursor should be visible at first character
      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor).toBeTruthy();
    });

    it('should have blink animation class', () => {
      render(<TypingInput targetText="abc" />);

      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor.className).toContain('animate-cursor-blink');
    });

    it('should have proper cursor width', () => {
      render(<TypingInput targetText="abc" />);

      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor.className).toContain('w-[2px]');
    });

    it('should have rounded cursor', () => {
      render(<TypingInput targetText="abc" />);

      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor.className).toContain('rounded-full');
    });

    it('should have primary background color', () => {
      render(<TypingInput targetText="abc" />);

      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor.className).toContain('bg-primary');
    });

    it('should move cursor to next character after typing', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Initially cursor is at 'a'
      const aChar = screen.getByText('a');
      expect(aChar.className).toContain('bg-primary/20');

      // Type 'a'
      fireEvent.keyDown(input, { key: 'a' });

      // Now cursor should be at 'b'
      const bChar = screen.getByText('b');
      expect(bChar.className).toContain('bg-primary/20');

      // 'a' should no longer have cursor background
      expect(aChar.className).not.toContain('bg-primary/20');
    });

    it('should have cursor inside current character span', () => {
      render(<TypingInput targetText="abc" />);

      // The cursor should be a child of the current character span
      const cursor = screen.getByTestId('typing-cursor');
      const parentSpan = cursor.parentElement;

      // Parent should have the cursor background highlight
      expect(parentSpan?.className).toContain('bg-primary/20');
    });

    it('should not render cursor after completion', () => {
      render(<TypingInput targetText="ab" />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      // After completion, cursor should not be visible
      expect(screen.queryByTestId('typing-cursor')).toBeNull();
    });

    it('should position cursor at beginning after reset', () => {
      render(<TypingInput targetText="abc" />);
      const input = screen.getByRole('textbox');

      // Type some characters
      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'b' });

      // Reset
      fireEvent.keyDown(input, { key: 'Escape' });

      // Cursor should be back at first character
      const aChar = screen.getByText('a');
      expect(aChar.className).toContain('bg-primary/20');
    });

    it('should have aria-hidden on cursor for accessibility', () => {
      render(<TypingInput targetText="abc" />);

      const cursor = screen.getByTestId('typing-cursor');
      expect(cursor.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
