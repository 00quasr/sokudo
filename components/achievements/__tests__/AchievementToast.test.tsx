/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AchievementToast,
  AchievementToastContainer,
  type AchievementToastData,
} from '../AchievementToast';

const createAchievement = (
  overrides: Partial<AchievementToastData> = {},
): AchievementToastData => ({
  id: 1,
  slug: 'speed-50',
  name: 'Warming Up',
  description: 'Reach 50 WPM in any session',
  icon: 'gauge',
  ...overrides,
});

describe('AchievementToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render before delay elapses', () => {
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={vi.fn()}
        delay={500}
      />,
    );

    expect(screen.queryByTestId('achievement-toast')).toBeNull();
  });

  it('should render after delay elapses', () => {
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={vi.fn()}
        delay={0}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('achievement-toast')).toBeTruthy();
  });

  it('should display achievement name and description', () => {
    render(
      <AchievementToast
        achievement={createAchievement({
          name: 'Speed Demon',
          description: 'Reach 100 WPM in any session',
        })}
        onDismiss={vi.fn()}
        delay={0}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('Speed Demon')).toBeTruthy();
    expect(screen.getByText('Reach 100 WPM in any session')).toBeTruthy();
  });

  it('should display "Achievement Unlocked" label', () => {
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={vi.fn()}
        delay={0}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('Achievement Unlocked')).toBeTruthy();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={onDismiss}
        delay={0}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    fireEvent.click(screen.getByLabelText('Dismiss'));

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after 5 seconds', () => {
    const onDismiss = vi.fn();
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={onDismiss}
        delay={0}
      />,
    );

    // Show the toast
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // 5s auto-close triggers exit state
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 300ms exit animation then onDismiss fires
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should have accessible role and aria attributes', () => {
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={vi.fn()}
        delay={0}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const toast = screen.getByTestId('achievement-toast');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
  });

  it('should render with delay', () => {
    render(
      <AchievementToast
        achievement={createAchievement()}
        onDismiss={vi.fn()}
        delay={800}
      />,
    );

    // Not yet visible
    expect(screen.queryByTestId('achievement-toast')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByTestId('achievement-toast')).toBeTruthy();
  });
});

describe('AchievementToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render nothing when achievements array is empty', () => {
    const { container } = render(
      <AchievementToastContainer achievements={[]} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should render multiple achievement toasts', () => {
    const achievements = [
      createAchievement({ id: 1, name: 'Warming Up' }),
      createAchievement({ id: 2, name: 'Sharpshooter', slug: 'accuracy-95' }),
    ];

    render(<AchievementToastContainer achievements={achievements} />);

    // First one shows immediately (delay=0)
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('Warming Up')).toBeTruthy();

    // Second one shows after 800ms delay
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('Sharpshooter')).toBeTruthy();
  });

  it('should call onAllDismissed when all toasts are dismissed', () => {
    const onAllDismissed = vi.fn();
    const achievements = [
      createAchievement({ id: 1, name: 'Warming Up' }),
    ];

    render(
      <AchievementToastContainer
        achievements={achievements}
        onAllDismissed={onAllDismissed}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Click dismiss
    fireEvent.click(screen.getByLabelText('Dismiss'));

    // Wait for exit animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onAllDismissed).toHaveBeenCalledTimes(1);
  });

  it('should stagger toast appearances with delay', () => {
    const achievements = [
      createAchievement({ id: 1, name: 'First' }),
      createAchievement({ id: 2, name: 'Second', slug: 'speed-60' }),
      createAchievement({ id: 3, name: 'Third', slug: 'speed-70' }),
    ];

    render(<AchievementToastContainer achievements={achievements} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.queryByText('Second')).toBeNull();
    expect(screen.queryByText('Third')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.queryByText('Third')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText('Third')).toBeTruthy();
  });

  it('should have aria-label on container', () => {
    const achievements = [createAchievement({ id: 1 })];

    render(<AchievementToastContainer achievements={achievements} />);

    expect(
      screen.getByLabelText('Achievement notifications'),
    ).toBeTruthy();
  });
});
