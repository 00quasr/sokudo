/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamAchievementsLoading from '../loading';

describe('TeamAchievementsLoading', () => {
  it('should render the page title', () => {
    render(<TeamAchievementsLoading />);

    expect(screen.getByText('Team Achievements')).toBeTruthy();
  });

  it('should render skeleton loaders', () => {
    const { container } = render(<TeamAchievementsLoading />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render three overview stat cards', () => {
    const { container } = render(<TeamAchievementsLoading />);

    const grid = container.querySelector('.grid-cols-2.lg\\:grid-cols-3');
    expect(grid).toBeTruthy();

    const cards = grid?.querySelectorAll('.rounded-xl');
    expect(cards?.length).toBe(3);
  });

  it('should render skeleton achievement rows', () => {
    const { container } = render(<TeamAchievementsLoading />);

    const skeletonRows = container.querySelectorAll('.rounded-full.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should have proper section layout', () => {
    const { container } = render(<TeamAchievementsLoading />);

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('flex-1')).toBe(true);
  });
});
