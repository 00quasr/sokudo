/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamChallengesLoading from '../loading';

describe('TeamChallengesLoading', () => {
  it('should render the page title', () => {
    render(<TeamChallengesLoading />);
    expect(screen.getByText('Team Challenges')).toBeDefined();
  });

  it('should render skeleton challenge cards', () => {
    const { container } = render(<TeamChallengesLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
