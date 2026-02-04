/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamActivityLoading from '../loading';

describe('TeamActivityLoading', () => {
  it('should render the page title', () => {
    render(<TeamActivityLoading />);

    expect(screen.getByText('Team Activity')).toBeTruthy();
  });

  it('should render the card title', () => {
    render(<TeamActivityLoading />);

    expect(screen.getByText('Recent Activity')).toBeTruthy();
  });

  it('should render skeleton loaders', () => {
    const { container } = render(<TeamActivityLoading />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should render five skeleton rows', () => {
    const { container } = render(<TeamActivityLoading />);

    // Each skeleton row has an avatar placeholder (size-8 rounded-full)
    const avatarPlaceholders = container.querySelectorAll('.size-8.rounded-full');
    expect(avatarPlaceholders.length).toBe(5);
  });

  it('should have proper section layout', () => {
    const { container } = render(<TeamActivityLoading />);

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('flex-1')).toBe(true);
  });
});
