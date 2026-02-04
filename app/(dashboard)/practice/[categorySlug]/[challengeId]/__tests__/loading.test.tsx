/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChallengeLoading from '../loading';

describe('ChallengeLoading', () => {
  it('should render the loading skeleton', () => {
    render(<ChallengeLoading />);

    // Check that the main structure is rendered
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('should render header skeleton with animated elements', () => {
    const { container } = render(<ChallengeLoading />);

    // Check for header element
    const header = container.querySelector('header');
    expect(header).toBeTruthy();

    // Check for animated pulse elements in header
    const headerPulseElements = header?.querySelectorAll('.animate-pulse');
    expect(headerPulseElements?.length).toBeGreaterThan(0);
  });

  it('should render typing area skeleton', () => {
    const { container } = render(<ChallengeLoading />);

    // Check for the typing area skeleton (rounded-lg border card)
    const typingAreaSkeleton = container.querySelector('.rounded-lg.border.border-border.bg-card');
    expect(typingAreaSkeleton).toBeTruthy();
  });

  it('should render stats bar skeleton elements', () => {
    const { container } = render(<ChallengeLoading />);

    // Check for multiple skeleton elements representing stats
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(5);
  });

  it('should render footer with keyboard shortcut skeletons', () => {
    const { container } = render(<ChallengeLoading />);

    // Check for the border-t footer section
    const footer = container.querySelector('.border-t.border-border');
    expect(footer).toBeTruthy();
  });

  it('should have proper accessibility structure', () => {
    render(<ChallengeLoading />);

    // Main landmark is present
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('should render with proper background color', () => {
    render(<ChallengeLoading />);

    const main = screen.getByRole('main');
    expect(main.className).toContain('bg-background');
  });
});
