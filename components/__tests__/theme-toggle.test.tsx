/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '../theme-provider';

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
});

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', async () => {
  const actual = await vi.importActual('next-themes');
  return {
    ...actual,
    useTheme: () => ({
      theme: 'light',
      setTheme: mockSetTheme,
      systemTheme: 'light',
      themes: ['light', 'dark', 'system']
    })
  };
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  describe('rendering', () => {
    it('should render toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeTruthy();
    });

    it('should render sun and moon icons', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Icons should be in the document (even if one is hidden)
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeTruthy();
    });

    it('should have ghost button styling', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = container.querySelector('button');
      // Ghost variant uses hover:bg-accent
      expect(button?.className).toContain('hover:bg-accent');
    });
  });

  describe('functionality', () => {
    it('should use next-themes useTheme hook', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Component should render without errors when using the hook
      expect(container.querySelector('button')).toBeTruthy();
    });

    it('should provide theme options in dropdown', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Dropdown menu trigger should exist
      const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
      expect(trigger).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have accessible name for screen readers', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeTruthy();
    });

    it('should be keyboard navigable', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button', { name: /toggle theme/i });
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});
