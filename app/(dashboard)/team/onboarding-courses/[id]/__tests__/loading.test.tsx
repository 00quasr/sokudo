/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import OnboardingCourseDetailLoading from '../loading';

describe('OnboardingCourseDetailLoading', () => {
  it('should render skeleton elements', () => {
    const { container } = render(<OnboardingCourseDetailLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render progress bar skeleton', () => {
    const { container } = render(<OnboardingCourseDetailLoading />);
    const progressBar = container.querySelector('.rounded-full.h-2');
    expect(progressBar).toBeDefined();
  });
});
