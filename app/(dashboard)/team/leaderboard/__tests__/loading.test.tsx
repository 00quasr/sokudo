/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamLeaderboardLoading from '../loading';

describe('TeamLeaderboardLoading', () => {
  it('should render the page title', () => {
    render(<TeamLeaderboardLoading />);

    expect(screen.getByText('Team Leaderboard')).toBeTruthy();
  });

  it('should render skeleton loaders', () => {
    const { container } = render(<TeamLeaderboardLoading />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render four overview stat cards', () => {
    const { container } = render(<TeamLeaderboardLoading />);

    const grid = container.querySelector('.grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeTruthy();

    const cards = grid?.querySelectorAll('.rounded-xl');
    expect(cards?.length).toBe(4);
  });

  it('should render skeleton rows for leaderboard', () => {
    const { container } = render(<TeamLeaderboardLoading />);

    // Should have skeleton rows with avatar placeholders
    const avatarSkeletons = container.querySelectorAll('.rounded-full.animate-pulse');
    expect(avatarSkeletons.length).toBeGreaterThan(0);
  });

  it('should have proper section layout', () => {
    const { container } = render(<TeamLeaderboardLoading />);

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('flex-1')).toBe(true);
  });
});
