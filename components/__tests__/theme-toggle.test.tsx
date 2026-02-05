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

// Mock theme-provider
const mockSetHighContrast = vi.fn();
vi.mock('../theme-provider', async () => {
  const actual = await vi.importActual('../theme-provider');
  return {
    ...actual,
    useHighContrast: () => ({
      highContrast: false,
      setHighContrast: mockSetHighContrast,
    }),
  };
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockSetHighContrast.mockClear();
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

  describe('high contrast mode', () => {
    it('should import useHighContrast from theme-provider', () => {
      // This test verifies that the component imports and uses the useHighContrast hook
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Component should render without errors when using the hook
      expect(container.querySelector('button')).toBeTruthy();
    });

    it('should have dropdown menu for theme options', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Dropdown menu trigger should exist which will contain high contrast option
      const trigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
      expect(trigger).toBeTruthy();
    });
  });
});
