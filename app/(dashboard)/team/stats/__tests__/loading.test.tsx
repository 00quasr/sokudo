/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamStatsLoading from '../loading';

describe('TeamStatsLoading', () => {
  it('should render the page title', () => {
    render(<TeamStatsLoading />);

    expect(screen.getByText('Team Statistics')).toBeTruthy();
  });

  it('should render skeleton loaders', () => {
    const { container } = render(<TeamStatsLoading />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render four overview stat cards', () => {
    const { container } = render(<TeamStatsLoading />);

    const grid = container.querySelector('.grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeTruthy();

    const cards = grid?.querySelectorAll('.rounded-xl');
    expect(cards?.length).toBe(4);
  });

  it('should render skeleton for WPM trend chart', () => {
    const { container } = render(<TeamStatsLoading />);

    // Should have a chart placeholder
    const chartSkeleton = container.querySelector('.h-40.animate-pulse');
    expect(chartSkeleton).toBeTruthy();
  });

  it('should render skeleton rows for category performance', () => {
    const { container } = render(<TeamStatsLoading />);

    // Should have multiple skeleton rows
    const skeletonRows = container.querySelectorAll('.border-b.border-gray-100');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('should have proper section layout', () => {
    const { container } = render(<TeamStatsLoading />);

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('flex-1')).toBe(true);
  });
});
