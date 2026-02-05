/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '../theme-provider';

// Mock fetch
global.fetch = vi.fn();

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', async () => {
  const actual = await vi.importActual('next-themes');
  return {
    ...actual,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="theme-provider">{children}</div>
    ),
    useTheme: () => ({
      theme: 'light',
      setTheme: mockSetTheme,
    }),
  };
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('theme synchronization', () => {
    it('should fetch theme preference on mount', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: 'dark' }),
      } as Response);

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/preferences');
      });
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      // Should not throw
      expect(screen.getByText('Content')).toBeTruthy();
    });

    it('should handle non-ok response gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      // Should not throw
      expect(screen.getByText('Content')).toBeTruthy();
    });
  });

  describe('high contrast mode', () => {
    it('should fetch high contrast preference on mount', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: 'dark', highContrast: true }),
      } as Response);

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/preferences');
      });
    });

    it('should apply high contrast class to document when enabled', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: 'dark', highContrast: true }),
      } as Response);

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      });
    });

    it('should remove high contrast class when disabled', async () => {
      document.documentElement.classList.add('high-contrast');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: 'dark', highContrast: false }),
      } as Response);

      render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
      });
    });
  });
});
