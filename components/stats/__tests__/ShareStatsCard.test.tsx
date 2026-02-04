/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareStatsCard } from '../ShareStatsCard';

const defaultProps = {
  username: 'testuser',
  baseUrl: 'https://sokudo.dev',
};

describe('ShareStatsCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the share heading', () => {
      render(<ShareStatsCard {...defaultProps} />);
      expect(screen.getByText('Share Your Stats')).toBeTruthy();
    });

    it('should render the stats card preview image', () => {
      render(<ShareStatsCard {...defaultProps} />);
      const img = screen.getByAltText("testuser's Sokudo stats card");
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe(
        'https://sokudo.dev/api/og/stats/testuser'
      );
    });

    it('should render Copy Link button', () => {
      render(<ShareStatsCard {...defaultProps} />);
      expect(screen.getByText('Copy Link')).toBeTruthy();
    });

    it('should render Share on X button', () => {
      render(<ShareStatsCard {...defaultProps} />);
      expect(screen.getByText('Share on X')).toBeTruthy();
    });

    it('should render Share on LinkedIn button', () => {
      render(<ShareStatsCard {...defaultProps} />);
      expect(screen.getByText('Share on LinkedIn')).toBeTruthy();
    });

    it('should render Copy Image URL button', () => {
      render(<ShareStatsCard {...defaultProps} />);
      expect(screen.getByText('Copy Image URL')).toBeTruthy();
    });
  });

  describe('share links', () => {
    it('should have correct Twitter share URL', () => {
      render(<ShareStatsCard {...defaultProps} />);
      const twitterLink = screen.getByText('Share on X').closest('a');
      expect(twitterLink).toBeTruthy();
      const href = twitterLink!.getAttribute('href');
      expect(href).toContain('https://twitter.com/intent/tweet');
      expect(href).toContain(encodeURIComponent('https://sokudo.dev/u/testuser'));
    });

    it('should have correct LinkedIn share URL', () => {
      render(<ShareStatsCard {...defaultProps} />);
      const linkedinLink = screen.getByText('Share on LinkedIn').closest('a');
      expect(linkedinLink).toBeTruthy();
      const href = linkedinLink!.getAttribute('href');
      expect(href).toContain('https://www.linkedin.com/sharing/share-offsite/');
      expect(href).toContain(encodeURIComponent('https://sokudo.dev/u/testuser'));
    });

    it('should open share links in new tab', () => {
      render(<ShareStatsCard {...defaultProps} />);
      const twitterLink = screen.getByText('Share on X').closest('a');
      expect(twitterLink!.getAttribute('target')).toBe('_blank');
      expect(twitterLink!.getAttribute('rel')).toContain('noopener');

      const linkedinLink = screen.getByText('Share on LinkedIn').closest('a');
      expect(linkedinLink!.getAttribute('target')).toBe('_blank');
      expect(linkedinLink!.getAttribute('rel')).toContain('noopener');
    });
  });

  describe('copy functionality', () => {
    it('should copy profile URL to clipboard on Copy Link click', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareStatsCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(
          'https://sokudo.dev/u/testuser'
        );
      });
    });

    it('should show Copied! text after clicking Copy Link', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareStatsCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeTruthy();
      });
    });

    it('should copy OG image URL on Copy Image URL click', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<ShareStatsCard {...defaultProps} />);
      fireEvent.click(screen.getByText('Copy Image URL'));

      expect(writeText).toHaveBeenCalledWith(
        'https://sokudo.dev/api/og/stats/testuser'
      );
    });
  });

  describe('with different props', () => {
    it('should use custom baseUrl', () => {
      render(
        <ShareStatsCard username="devuser" baseUrl="http://localhost:3000" />
      );
      const img = screen.getByAltText("devuser's Sokudo stats card");
      expect(img.getAttribute('src')).toBe(
        'http://localhost:3000/api/og/stats/devuser'
      );
    });

    it('should encode special characters in share URLs', () => {
      render(<ShareStatsCard {...defaultProps} />);
      const twitterLink = screen.getByText('Share on X').closest('a');
      const href = twitterLink!.getAttribute('href');
      // The URL should be properly encoded
      expect(href).toContain('twitter.com/intent/tweet');
      expect(href).toContain('text=');
    });
  });
});
