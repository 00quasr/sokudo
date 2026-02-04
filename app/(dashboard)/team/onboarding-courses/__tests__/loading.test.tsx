/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingCoursesLoading from '../loading';

describe('OnboardingCoursesLoading', () => {
  it('should render the page title', () => {
    render(<OnboardingCoursesLoading />);
    expect(screen.getByText('Onboarding Courses')).toBeDefined();
  });

  it('should render skeleton cards', () => {
    const { container } = render(<OnboardingCoursesLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
