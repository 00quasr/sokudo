/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CategoryLoading from '../loading';

describe('CategoryLoading', () => {
  it('should render skeleton for back link', () => {
    const { container } = render(<CategoryLoading />);

    // Back link skeleton - first skeleton in the DOM
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render skeleton for category icon', () => {
    const { container } = render(<CategoryLoading />);

    // Icon skeleton - 14x14 rounded-lg
    const iconSkeleton = container.querySelector('.h-14.w-14.rounded-lg');
    expect(iconSkeleton).toBeTruthy();
  });

  it('should render skeleton for category title', () => {
    const { container } = render(<CategoryLoading />);

    // Title skeleton - h-8 w-48
    const titleSkeleton = container.querySelector('.h-8.w-48');
    expect(titleSkeleton).toBeTruthy();
  });

  it('should render skeleton for difficulty badge', () => {
    const { container } = render(<CategoryLoading />);

    // Badge skeleton - h-5 w-16 rounded-full
    const badgeSkeletons = container.querySelectorAll('.h-5.w-16.rounded-full');
    expect(badgeSkeletons.length).toBeGreaterThan(0);
  });

  it('should render skeleton for challenge count', () => {
    const { container } = render(<CategoryLoading />);

    // Challenge count skeleton - h-4 w-24
    const countSkeleton = container.querySelector('.h-4.w-24');
    expect(countSkeleton).toBeTruthy();
  });

  it('should render skeleton for description', () => {
    const { container } = render(<CategoryLoading />);

    // Description skeleton - h-5 w-full max-w-md
    const descSkeleton = container.querySelector('.h-5.w-full.max-w-md');
    expect(descSkeleton).toBeTruthy();
  });

  it('should render 6 challenge card skeletons', () => {
    const { container } = render(<CategoryLoading />);

    // Challenge cards have flex items-center justify-between
    const cardSkeletons = container.querySelectorAll('.flex.items-center.justify-between.rounded-lg.border');
    expect(cardSkeletons.length).toBe(6);
  });

  it('should render skeletons for challenge content', () => {
    const { container } = render(<CategoryLoading />);

    // Challenge content skeleton - h-4 w-48
    const contentSkeletons = container.querySelectorAll('.h-4.w-48');
    expect(contentSkeletons.length).toBe(6);
  });

  it('should render skeletons for challenge hints', () => {
    const { container } = render(<CategoryLoading />);

    // Hint skeleton - h-3 w-32
    const hintSkeletons = container.querySelectorAll('.h-3.w-32');
    expect(hintSkeletons.length).toBe(6);
  });

  it('should render skeletons for challenge numbers', () => {
    const { container } = render(<CategoryLoading />);

    // Number skeleton - h-8 w-8 rounded-full
    const numberSkeletons = container.querySelectorAll('.h-8.w-8.rounded-full');
    expect(numberSkeletons.length).toBe(6);
  });

  it('should use animate-pulse for loading animation', () => {
    const { container } = render(<CategoryLoading />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should use gray-200 background for skeleton elements', () => {
    const { container } = render(<CategoryLoading />);

    const grayElements = container.querySelectorAll('.bg-gray-200');
    expect(grayElements.length).toBeGreaterThan(0);
  });

  it('should have consistent max-width container', () => {
    const { container } = render(<CategoryLoading />);

    const mainElement = container.querySelector('main.max-w-4xl');
    expect(mainElement).toBeTruthy();
  });

  it('should have proper spacing', () => {
    const { container } = render(<CategoryLoading />);

    // Check for space-y-3 on challenge list container
    const spaceContainer = container.querySelector('.space-y-3');
    expect(spaceContainer).toBeTruthy();
  });
});
