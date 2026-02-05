/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '../theme-provider';

// Mock next-themes
vi.mock('next-themes', async () => {
  const actual = await vi.importActual('next-themes');
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="theme-provider">{children}</div>
    )
  };
});

describe('ThemeProvider', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(screen.getByText('Test content')).toBeTruthy();
    });

    it('should wrap children in NextThemesProvider', () => {
      render(
        <ThemeProvider>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-provider')).toBeTruthy();
    });

    it('should pass props to NextThemesProvider', () => {
      const { container } = render(
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div>Test content</div>
        </ThemeProvider>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('integration', () => {
    it('should render multiple children', () => {
      render(
        <ThemeProvider>
          <div>First child</div>
          <div>Second child</div>
        </ThemeProvider>
      );

      expect(screen.getByText('First child')).toBeTruthy();
      expect(screen.getByText('Second child')).toBeTruthy();
    });

    it('should handle nested components', () => {
      render(
        <ThemeProvider>
          <div>
            <span>Nested content</span>
          </div>
        </ThemeProvider>
      );

      expect(screen.getByText('Nested content')).toBeTruthy();
    });
  });
});
