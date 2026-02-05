import { render, screen } from '@testing-library/react';
import { ChallengeProgress } from '@/components/typing/ChallengeProgress';

describe('ChallengeProgress Accessibility', () => {
  it('has proper status role with aria-live when transitioning', () => {
    render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={true}
      />
    );

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'assertive');
  });

  it('has accessible aria-label for status', () => {
    render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={true}
      />
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Challenge 5 of 10 complete. Loading next challenge');
  });

  it('displays progress message', () => {
    render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={true}
      />
    );

    expect(screen.getByText('Challenge 5/10 complete')).toBeInTheDocument();
    expect(screen.getByText('Next challenge loading...')).toBeInTheDocument();
  });

  it('has progress bar with proper aria attributes', () => {
    render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={true}
      />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Challenge progress: 50%');
  });

  it('displays completion state when at end', () => {
    render(
      <ChallengeProgress
        current={10}
        total={10}
        isTransitioning={true}
      />
    );

    expect(screen.getByText('Challenge 10/10 complete')).toBeInTheDocument();
    expect(screen.getByText('Category complete!')).toBeInTheDocument();
  });

  it('has accessible aria-label for completion', () => {
    render(
      <ChallengeProgress
        current={10}
        total={10}
        isTransitioning={true}
      />
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Challenge 10 of 10 complete. Category complete!');
  });

  it('hides decorative icons from screen readers', () => {
    const { container } = render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={true}
      />
    );

    const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenIcons.length).toBeGreaterThan(0);
  });

  it('does not render when not transitioning', () => {
    const { container } = render(
      <ChallengeProgress
        current={5}
        total={10}
        isTransitioning={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
