/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TypingInput } from '../TypingInput';

describe('TypingInput - Tablet Touch Optimizations', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockVisualViewport: {
    height: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock matchMedia for tablet detection
    mockMatchMedia = vi.fn((query: string) => ({
      matches: query.includes('pointer: coarse') && query.includes('min-width: 768px'),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    // Mock visualViewport for keyboard detection
    mockVisualViewport = {
      height: 1024,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    });

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tablet device detection', () => {
    it('should render typing container with tablet classes', () => {
      render(
        <TypingInput
          targetText="git status"
          syntaxType="shell"
        />
      );

      const container = screen.getByRole('textbox');
      expect(container).toHaveClass('typing-container-tablet');
      expect(container).toHaveClass('typing-container-ipad-pro');
    });
  });

  describe('touch event handling', () => {
    it('should handle touchstart event', () => {
      render(
        <TypingInput
          targetText="docker ps"
          syntaxType="docker"
        />
      );

      const container = screen.getByRole('textbox');

      // Simulate touch start - should not throw
      expect(() => {
        fireEvent.touchStart(container);
      }).not.toThrow();
    });

    it('should handle touchend event', () => {
      render(
        <TypingInput
          targetText="npm test"
          syntaxType="npm"
        />
      );

      const container = screen.getByRole('textbox');

      // Simulate touch events - should not throw
      expect(() => {
        fireEvent.touchStart(container);
        fireEvent.touchEnd(container);
      }).not.toThrow();
    });
  });

  describe('mobile input handling for tablets', () => {
    it('should process multiple characters on tablet keyboard input', () => {
      const onKeystroke = vi.fn();

      render(
        <TypingInput
          targetText="git status"
          syntaxType="git"
          onKeystroke={onKeystroke}
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();

      // Simulate tablet keyboard sending multiple characters
      act(() => {
        fireEvent.change(hiddenInput, { target: { value: 'git' } });
      });

      // Should process each character individually
      expect(onKeystroke).toHaveBeenCalled();
    });

    it('should clear input after processing characters', () => {
      render(
        <TypingInput
          targetText="npm"
          syntaxType="npm"
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      act(() => {
        fireEvent.change(hiddenInput, { target: { value: 'n' } });
      });

      // Input should be cleared for continuous typing
      expect(hiddenInput.value).toBe('');
    });
  });

  describe('hidden input optimizations', () => {
    it('should have autocomplete disabled', () => {
      render(
        <TypingInput
          targetText="git clone"
          syntaxType="git"
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();
      expect(hiddenInput.getAttribute('autocomplete')).toBe('off');
      expect(hiddenInput.getAttribute('autocorrect')).toBe('off');
      expect(hiddenInput.getAttribute('autocapitalize')).toBe('off');
      expect(hiddenInput.getAttribute('spellcheck')).toBe('false');
    });

    it('should have password manager ignore attributes', () => {
      render(
        <TypingInput
          targetText="yarn install"
          syntaxType="yarn"
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput.getAttribute('data-1p-ignore')).toBe('true');
      expect(hiddenInput.getAttribute('data-lpignore')).toBe('true');
    });
  });

  describe('touch feedback and user experience', () => {
    it('should handle container click', () => {
      render(
        <TypingInput
          targetText="docker run"
          syntaxType="docker"
        />
      );

      const container = screen.getByRole('textbox');

      // Simulate container click - should not throw
      expect(() => {
        fireEvent.click(container);
      }).not.toThrow();
    });

    it('should apply touch-manipulation class', () => {
      render(
        <TypingInput
          targetText="git merge"
          syntaxType="git"
        />
      );

      const container = screen.getByRole('textbox');
      expect(container).toHaveClass('touch-manipulation');
    });

    it('should have transition classes for smooth animations', () => {
      render(
        <TypingInput
          targetText="yarn test"
          syntaxType="yarn"
        />
      );

      const container = screen.getByRole('textbox');
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('duration-200');
    });

    it('should have responsive text sizing', () => {
      render(
        <TypingInput
          targetText="sql SELECT"
          syntaxType="sql"
        />
      );

      const container = screen.getByRole('textbox');
      // Check that container has responsive font size classes
      expect(container.className).toMatch(/text-base|text-lg|text-xl|text-2xl/);
    });
  });

  describe('orientation and viewport handling', () => {
    it('should setup viewport event listeners', () => {
      render(
        <TypingInput
          targetText="npm build"
          syntaxType="npm"
        />
      );

      // Verify addEventListener was called for viewport
      expect(mockVisualViewport.addEventListener).toHaveBeenCalled();
    });

    it('should cleanup viewport event listeners on unmount', () => {
      const { unmount } = render(
        <TypingInput
          targetText="pnpm dev"
          syntaxType="pnpm"
        />
      );

      // Unmount component
      unmount();

      // Verify removeEventListener was called
      expect(mockVisualViewport.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('keyboard visibility detection', () => {
    it('should have visualViewport listeners for keyboard detection', () => {
      render(
        <TypingInput
          targetText="yarn build"
          syntaxType="yarn"
        />
      );

      // Check that resize and scroll listeners were added
      const calls = mockVisualViewport.addEventListener.mock.calls;
      const events = calls.map(call => call[0]);

      expect(events).toContain('resize');
      expect(events).toContain('scroll');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TypingInput
          targetText="git add ."
          syntaxType="git"
        />
      );

      const container = screen.getByRole('textbox');
      expect(container).toHaveAttribute('aria-label', 'Typing input area');
      expect(container).toHaveAttribute('aria-readonly', 'true');
    });

    it('should have hidden input with proper ARIA attributes', () => {
      render(
        <TypingInput
          targetText="docker build"
          syntaxType="docker"
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(hiddenInput).toBeTruthy();
      expect(hiddenInput.getAttribute('aria-hidden')).toBe('true');
      expect(hiddenInput.getAttribute('aria-autocomplete')).toBe('none');
    });
  });

  describe('cursor visibility', () => {
    it('should render cursor when typing starts', () => {
      render(
        <TypingInput
          targetText="git add ."
          syntaxType="git"
        />
      );

      const container = screen.getByRole('textbox');
      const hiddenInput = container.querySelector('input[type="text"]') as HTMLInputElement;

      // Type a character to start the session
      act(() => {
        fireEvent.change(hiddenInput, { target: { value: 'g' } });
      });

      // Cursor should be visible
      const cursor = container.querySelector('[data-testid="typing-cursor"]');
      expect(cursor).toBeTruthy();
    });
  });

  describe('responsive design', () => {
    it('should have responsive padding classes', () => {
      render(
        <TypingInput
          targetText="pnpm install"
          syntaxType="pnpm"
        />
      );

      const container = screen.getByRole('textbox');
      // Check for responsive padding
      expect(container.className).toMatch(/p-\d|sm:p-\d|md:p-\d|lg:p-\d/);
    });

    it('should have responsive minimum height', () => {
      render(
        <TypingInput
          targetText="yarn add"
          syntaxType="yarn"
        />
      );

      const container = screen.getByRole('textbox');
      // Check for responsive min-height
      expect(container.className).toMatch(/min-h-\[.*?\]/);
    });
  });
});
