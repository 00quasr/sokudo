/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsLoading from '../loading';

describe('StatsLoading', () => {
  it('should render the page title', () => {
    render(<StatsLoading />);

    expect(screen.getByText('Your Stats')).toBeTruthy();
  });

  it('should render skeleton loaders', () => {
    const { container } = render(<StatsLoading />);

    // Check for animate-pulse class (skeleton animation)
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render four overview stat cards', () => {
    const { container } = render(<StatsLoading />);

    // Check for the grid with 4 stat cards
    const grid = container.querySelector('.grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeTruthy();

    // Should have 4 skeleton cards in the first grid
    const cards = grid?.querySelectorAll('.rounded-xl');
    expect(cards?.length).toBe(4);
  });

  it('should render two detail cards', () => {
    const { container } = render(<StatsLoading />);

    // Check for the grid with 2 detail cards
    const grid = container.querySelector('.lg\\:grid-cols-2');
    expect(grid).toBeTruthy();

    // Should have 2 cards in the detail grid
    const cards = grid?.querySelectorAll('.rounded-xl');
    expect(cards?.length).toBe(2);
  });

  it('should have proper section layout', () => {
    const { container } = render(<StatsLoading />);

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('flex-1')).toBe(true);
  });

  it('should render skeleton circles for icons', () => {
    const { container } = render(<StatsLoading />);

    const iconSkeletons = container.querySelectorAll('.rounded-full.animate-pulse');
    expect(iconSkeletons.length).toBe(4);
  });
});
