/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TeamChallengeDetailLoading from '../loading';

describe('TeamChallengeDetailLoading', () => {
  it('should render skeleton elements', () => {
    const { container } = render(<TeamChallengeDetailLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render stat card skeletons', () => {
    const { container } = render(<TeamChallengeDetailLoading />);
    // 4 stat cards + challenge content + rankings = multiple skeleton areas
    const cards = container.querySelectorAll('[class*="rounded-full"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render ranking row skeletons', () => {
    const { container } = render(<TeamChallengeDetailLoading />);
    // Each skeleton row has a circular avatar skeleton
    const avatarSkeletons = container.querySelectorAll('.rounded-full.animate-pulse');
    expect(avatarSkeletons.length).toBeGreaterThan(0);
  });
});
