/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIHintTip } from '../AIHintTip';

const defaultProps = {
  challengeContent: 'git stash pop',
  syntaxType: 'bash',
  difficulty: 'intermediate',
  categoryName: 'Git Commands',
};

const mockHintResponse = {
  tip: 'Use git stash pop to apply and remove stashed changes.',
  explanation: 'git stash pop applies the top stash entry and removes it from the stash list.',
  improvementSuggestion: 'Focus on typing common git subcommands to build muscle memory.',
};

describe('AIHintTip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render the Get AI Tips button initially', () => {
    render(<AIHintTip {...defaultProps} />);

    expect(screen.getByTestId('ai-hint-button')).toBeTruthy();
    expect(screen.getByText('Get AI Tips')).toBeTruthy();
  });

  it('should show loading state when button is clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {})
    );

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-hint-loading')).toBeTruthy();
      expect(screen.getByText('Generating tips...')).toBeTruthy();
    });
  });

  it('should display hint content after successful fetch', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hint: mockHintResponse }),
    });

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
      expect(screen.getByTestId('ai-hint-tip')).toBeTruthy();
      expect(screen.getByTestId('ai-hint-explanation')).toBeTruthy();
      expect(screen.getByTestId('ai-hint-improvement')).toBeTruthy();
    });

    expect(screen.getByTestId('ai-hint-tip').textContent).toBe(mockHintResponse.tip);
    expect(screen.getByTestId('ai-hint-explanation').textContent).toBe(
      mockHintResponse.explanation
    );
    expect(screen.getByTestId('ai-hint-improvement').textContent).toBe(
      mockHintResponse.improvementSuggestion
    );
  });

  it('should show error message when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to generate hint' }),
    });

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByText('Failed to generate hint')).toBeTruthy();
    });
  });

  it('should show error message on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('should send correct request body', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hint: mockHintResponse }),
    });

    render(
      <AIHintTip
        {...defaultProps}
        existingHint="Apply stashed changes"
        userWpm={45}
        userAccuracy={92}
        weakKeys={['s', 't']}
        commonTypos={[{ expected: 's', actual: 'a' }]}
      />
    );

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/practice/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeContent: 'git stash pop',
          syntaxType: 'bash',
          difficulty: 'intermediate',
          categoryName: 'Git Commands',
          existingHint: 'Apply stashed changes',
          userWpm: 45,
          userAccuracy: 92,
          weakKeys: ['s', 't'],
          commonTypos: [{ expected: 's', actual: 'a' }],
        }),
      });
    });
  });

  it('should not fetch again if hint is already loaded', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hint: mockHintResponse }),
    });

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should toggle expanded state when header is clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hint: mockHintResponse }),
    });

    render(<AIHintTip {...defaultProps} />);

    fireEvent.click(screen.getByTestId('ai-hint-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
    });

    // Initially expanded after load
    expect(screen.getByTestId('ai-hint-tip')).toBeTruthy();

    // Click to collapse
    fireEvent.click(screen.getByText('AI Tips'));

    await waitFor(() => {
      expect(screen.queryByTestId('ai-hint-tip')).toBeNull();
    });

    // Click to expand again
    fireEvent.click(screen.getByText('AI Tips'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-hint-tip')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on Get AI Tips button', () => {
      render(<AIHintTip {...defaultProps} />);

      const button = screen.getByTestId('ai-hint-button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('aria-label')).toContain('AI-generated tips');
    });

    it('should have aria-busy and role status during loading', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(() => {})
      );

      render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        const loadingElement = screen.getByTestId('ai-hint-loading');
        expect(loadingElement.getAttribute('role')).toBe('status');
        expect(loadingElement.getAttribute('aria-live')).toBe('polite');
        expect(loadingElement.getAttribute('aria-busy')).toBe('true');
      });
    });

    it('should have aria-expanded on toggle button', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hint: mockHintResponse }),
      });

      render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
      });

      const toggleButton = screen.getByText('AI Tips').closest('button');
      expect(toggleButton?.getAttribute('aria-expanded')).toBe('true');
      expect(toggleButton?.getAttribute('aria-controls')).toBe('ai-hint-details');
    });

    it('should update aria-expanded when collapsed', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hint: mockHintResponse }),
      });

      render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
      });

      const toggleButton = screen.getByText('AI Tips').closest('button');

      // Click to collapse
      fireEvent.click(toggleButton!);

      await waitFor(() => {
        expect(toggleButton?.getAttribute('aria-expanded')).toBe('false');
      });
    });

    it('should have role alert on error message', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to generate hint' }),
      });

      render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        const errorElement = screen.getByText('Failed to generate hint').closest('div');
        expect(errorElement?.getAttribute('role')).toBe('alert');
        expect(errorElement?.getAttribute('aria-live')).toBe('assertive');
      });
    });

    it('should have aria-hidden on decorative icons', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hint: mockHintResponse }),
      });

      const { container } = render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-hint-content')).toBeTruthy();
      });

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have role region on expanded content', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hint: mockHintResponse }),
      });

      const { container } = render(<AIHintTip {...defaultProps} />);

      fireEvent.click(screen.getByTestId('ai-hint-button'));

      await waitFor(() => {
        const detailsRegion = container.querySelector('#ai-hint-details[role="region"]');
        expect(detailsRegion).toBeTruthy();
        expect(detailsRegion?.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
