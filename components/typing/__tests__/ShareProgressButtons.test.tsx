/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareProgressButtons } from '../ShareProgressButtons';

describe('ShareProgressButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render share label', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      expect(screen.getByText('Share')).toBeTruthy();
    });

    it('should render Copy button', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      expect(screen.getByText('Copy')).toBeTruthy();
    });

    it('should render X (Twitter) button', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      expect(screen.getByText('X')).toBeTruthy();
    });

    it('should render LinkedIn button', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      expect(screen.getByText('LinkedIn')).toBeTruthy();
    });

    it('should render aria labels for accessibility', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      expect(screen.getByLabelText('Copy result to clipboard')).toBeTruthy();
      expect(screen.getByLabelText('Share on X (Twitter)')).toBeTruthy();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeTruthy();
    });
  });

  describe('Twitter share link', () => {
    it('should have correct Twitter intent URL', () => {
      render(<ShareProgressButtons wpm={85} accuracy={97} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href');
      expect(href).toContain('https://twitter.com/intent/tweet');
      expect(href).toContain(encodeURIComponent('85 WPM'));
      expect(href).toContain(encodeURIComponent('97% accuracy'));
    });

    it('should include category name when provided', () => {
      render(<ShareProgressButtons wpm={85} accuracy={97} categoryName="Git Commands" />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      expect(decodedUrl).toContain('practicing Git Commands');
    });

    it('should not include category when not provided', () => {
      render(<ShareProgressButtons wpm={85} accuracy={97} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      // Should say "accuracy on Sokudo" not "accuracy on <category> on Sokudo"
      expect(decodedUrl).toContain('97% accuracy on Sokudo');
    });

    it('should open in new tab', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  describe('LinkedIn share link', () => {
    it('should have correct LinkedIn sharing URL', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      const link = screen.getByLabelText('Share on LinkedIn');
      const href = link.getAttribute('href');
      expect(href).toContain('https://www.linkedin.com/sharing/share-offsite/');
    });

    it('should open in new tab', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      const link = screen.getByLabelText('Share on LinkedIn');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  describe('copy functionality', () => {
    it('should copy text to clipboard when Copy button is clicked', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareProgressButtons wpm={85} accuracy={97} categoryName="Git Commands" />);

      fireEvent.click(screen.getByText('Copy'));

      expect(writeText).toHaveBeenCalledTimes(1);
      const copiedText = writeText.mock.calls[0][0];
      expect(copiedText).toContain('85 WPM');
      expect(copiedText).toContain('97% accuracy');
      expect(copiedText).toContain('practicing Git Commands');
      expect(copiedText).toContain('Sokudo');
    });

    it('should show Copied! feedback after clicking', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      fireEvent.click(screen.getByText('Copy'));

      // Wait for state update
      await vi.waitFor(() => {
        expect(screen.getByText('Copied!')).toBeTruthy();
      });
    });

    it('should update aria-label when copied', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      fireEvent.click(screen.getByLabelText('Copy result to clipboard'));

      await vi.waitFor(() => {
        expect(screen.getByLabelText('Copied to clipboard')).toBeTruthy();
      });
    });

    it('should use fallback when clipboard API fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('Not allowed'));
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      const execCommand = vi.fn();
      document.execCommand = execCommand;

      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      fireEvent.click(screen.getByText('Copy'));

      await vi.waitFor(() => {
        expect(execCommand).toHaveBeenCalledWith('copy');
      });
    });
  });

  describe('share text content', () => {
    it('should include WPM in share text', () => {
      render(<ShareProgressButtons wpm={120} accuracy={99} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      expect(decodedUrl).toContain('120 WPM');
    });

    it('should include accuracy in share text', () => {
      render(<ShareProgressButtons wpm={60} accuracy={100} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      expect(decodedUrl).toContain('100% accuracy');
    });

    it('should mention Sokudo in share text', () => {
      render(<ShareProgressButtons wpm={60} accuracy={95} />);

      const link = screen.getByLabelText('Share on X (Twitter)');
      const href = link.getAttribute('href') || '';
      const decodedUrl = decodeURIComponent(href);
      expect(decodedUrl).toContain('Sokudo');
    });
  });
});
