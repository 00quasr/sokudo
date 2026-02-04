/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock the Terminal component (client component with useEffect)
vi.mock('../terminal', () => ({
  Terminal: () => <div data-testid="terminal">Terminal Mock</div>,
}));

import HomePage from '../page';

describe('HomePage', () => {
  describe('hero section', () => {
    it('should render the main heading', () => {
      render(<HomePage />);

      expect(screen.getByText('Master Developer Commands')).toBeTruthy();
    });

    it('should render the Sokudo tagline in Japanese', () => {
      render(<HomePage />);

      expect(screen.getByText('At Speed (速度)')).toBeTruthy();
    });

    it('should render the description', () => {
      render(<HomePage />);

      expect(
        screen.getByText(
          /Build muscle memory for git workflows, terminal commands, React patterns, and AI prompts/
        )
      ).toBeTruthy();
    });

    it('should render the start training CTA button', () => {
      render(<HomePage />);

      expect(screen.getByText('Start Training Free')).toBeTruthy();
    });

    it('should link to sign-up page', () => {
      render(<HomePage />);

      const ctaLink = screen.getByText('Start Training Free').closest('a');
      expect(ctaLink?.getAttribute('href')).toBe('/sign-up');
    });

    it('should render the Terminal component', () => {
      const { getByTestId } = render(<HomePage />);

      expect(getByTestId('terminal')).toBeTruthy();
    });
  });

  describe('features section', () => {
    it('should render Real-Time Feedback feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Real-Time Feedback')).toBeTruthy();
      expect(
        screen.getByText(
          /Instant keystroke accuracy tracking with syntax-highlighted commands/
        )
      ).toBeTruthy();
    });

    it('should render Targeted Practice feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Targeted Practice')).toBeTruthy();
      expect(
        screen.getByText(
          /Categories for git workflows, Docker commands, React patterns/
        )
      ).toBeTruthy();
    });

    it('should render Track Progress feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Track Progress')).toBeTruthy();
      expect(
        screen.getByText(/Monitor your WPM, accuracy, and keystroke latency/)
      ).toBeTruthy();
    });

    it('should render feature icons', () => {
      const { container } = render(<HomePage />);

      // Check that SVG icons are rendered (lucide icons render as SVGs)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe('CTA section', () => {
    it('should render the bottom CTA heading', () => {
      render(<HomePage />);

      expect(screen.getByText('Ready to type faster?')).toBeTruthy();
    });

    it('should render the bottom CTA description', () => {
      render(<HomePage />);

      expect(
        screen.getByText(
          /Start with 15 minutes a day of free practice/
        )
      ).toBeTruthy();
    });

    it('should render the practice button', () => {
      render(<HomePage />);

      expect(screen.getByText('Start Practicing')).toBeTruthy();
    });

    it('should link to practice page', () => {
      render(<HomePage />);

      const practiceLink = screen.getByText('Start Practicing').closest('a');
      expect(practiceLink?.getAttribute('href')).toBe('/practice');
    });
  });

  describe('styling', () => {
    it('should apply orange accent color to tagline', () => {
      render(<HomePage />);

      const tagline = screen.getByText('At Speed (速度)');
      expect(tagline.className).toContain('text-orange-500');
    });

    it('should render feature icon backgrounds with orange color', () => {
      const { container } = render(<HomePage />);

      const iconContainers = container.querySelectorAll(
        '.bg-orange-500'
      );
      expect(iconContainers.length).toBeGreaterThanOrEqual(3);
    });
  });
});
