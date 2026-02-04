/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PracticeLoading from '../loading';

describe('PracticeLoading', () => {
  it('should render skeleton loaders', () => {
    const { container } = render(<PracticeLoading />);

    // Check for animate-pulse class (skeleton animation)
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render multiple category card skeletons', () => {
    const { container } = render(<PracticeLoading />);

    // Should have skeleton cards for both free (4) and pro (6) sections
    const skeletonCards = container.querySelectorAll('.rounded-xl.border');
    expect(skeletonCards.length).toBe(10);
  });

  it('should have proper layout structure', () => {
    const { container } = render(<PracticeLoading />);

    // Check for grid layout
    const grids = container.querySelectorAll('.grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('should render title and description skeletons', () => {
    const { container } = render(<PracticeLoading />);

    // Title and description area should have skeleton placeholders
    const headerSkeletons = container.querySelectorAll('.text-center .bg-gray-200');
    expect(headerSkeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('should render section header skeletons', () => {
    const { container } = render(<PracticeLoading />);

    // Two section headers (Free and Pro)
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(2);
  });
});
