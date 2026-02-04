/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AchievementCard } from '../AchievementCard';

const earnedAchievement = {
  id: 1,
  slug: 'speed-50',
  name: 'Warming Up',
  description: 'Reach 50 WPM in any session',
  icon: 'gauge',
  earnedAt: new Date('2025-06-15T12:00:00Z'),
};

const unearnedAchievement = {
  id: 2,
  slug: 'speed-100',
  name: 'Speed Demon',
  description: 'Reach 100 WPM in any session',
  icon: 'zap',
  earnedAt: null,
};

const unearnedWithProgress = {
  id: 3,
  slug: 'speed-80',
  name: 'Velocity',
  description: 'Reach 80 WPM in any session',
  icon: 'zap',
  earnedAt: null,
  progress: {
    current: 64,
    target: 80,
    percentage: 80,
    label: '64/80 WPM',
  },
};

const unearnedLowProgress = {
  id: 4,
  slug: 'sessions-1000',
  name: 'Typing Legend',
  description: 'Complete 1000 typing sessions',
  icon: 'trophy',
  earnedAt: null,
  progress: {
    current: 200,
    target: 1000,
    percentage: 20,
    label: '200/1000 sessions',
  },
};

const unearnedMidProgress = {
  id: 5,
  slug: 'streak-30',
  name: 'Monthly Master',
  description: 'Practice for 30 consecutive days',
  icon: 'flame',
  earnedAt: null,
  progress: {
    current: 18,
    target: 30,
    percentage: 60,
    label: '18/30 days',
  },
};

describe('AchievementCard', () => {
  it('should render achievement name and description', () => {
    render(<AchievementCard achievement={earnedAchievement} />);

    expect(screen.getByText('Warming Up')).toBeTruthy();
    expect(screen.getByText('Reach 50 WPM in any session')).toBeTruthy();
  });

  it('should show earned date for unlocked achievements', () => {
    render(<AchievementCard achievement={earnedAchievement} />);

    expect(screen.getByText(/Earned/)).toBeTruthy();
    expect(screen.getByText(/Jun 15, 2025/)).toBeTruthy();
  });

  it('should not show earned date for locked achievements', () => {
    render(<AchievementCard achievement={unearnedAchievement} />);

    expect(screen.queryByText(/Earned/)).toBeNull();
  });

  it('should apply yellow styling for earned achievements', () => {
    render(<AchievementCard achievement={earnedAchievement} />);

    const card = screen.getByTestId('achievement-card');
    expect(card.className).toContain('border-yellow-500/20');
    expect(card.className).toContain('bg-yellow-500/5');
  });

  it('should apply muted styling for unearned achievements', () => {
    render(<AchievementCard achievement={unearnedAchievement} />);

    const card = screen.getByTestId('achievement-card');
    expect(card.className).toContain('border-gray-200');
    expect(card.className).toContain('opacity-60');
  });

  it('should render with data-testid attribute', () => {
    render(<AchievementCard achievement={earnedAchievement} />);

    expect(screen.getByTestId('achievement-card')).toBeTruthy();
  });

  it('should show lock icon for unearned achievements', () => {
    const { container } = render(
      <AchievementCard achievement={unearnedAchievement} />,
    );

    // Lock icon should be present in the gray circle
    const grayCircle = container.querySelector('.bg-gray-200');
    expect(grayCircle).toBeTruthy();
  });

  it('should show achievement icon for earned achievements', () => {
    const { container } = render(
      <AchievementCard achievement={earnedAchievement} />,
    );

    // Yellow circle should be present for earned
    const yellowCircle = container.querySelector('.bg-yellow-500\\/10');
    expect(yellowCircle).toBeTruthy();
  });

  // Progress bar tests
  describe('progress tracking', () => {
    it('should show progress bar for unearned achievements with progress', () => {
      render(<AchievementCard achievement={unearnedWithProgress} />);

      const progressSection = screen.getByTestId('achievement-progress');
      expect(progressSection).toBeTruthy();
    });

    it('should display progress label', () => {
      render(<AchievementCard achievement={unearnedWithProgress} />);

      expect(screen.getByText('64/80 WPM')).toBeTruthy();
    });

    it('should display progress percentage', () => {
      render(<AchievementCard achievement={unearnedWithProgress} />);

      expect(screen.getByText('80%')).toBeTruthy();
    });

    it('should render accessible progressbar role', () => {
      render(<AchievementCard achievement={unearnedWithProgress} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeTruthy();
      expect(progressBar.getAttribute('aria-valuenow')).toBe('80');
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should not show progress bar for earned achievements', () => {
      render(<AchievementCard achievement={earnedAchievement} />);

      expect(screen.queryByTestId('achievement-progress')).toBeNull();
    });

    it('should not show progress bar when progress is null', () => {
      render(<AchievementCard achievement={unearnedAchievement} />);

      expect(screen.queryByTestId('achievement-progress')).toBeNull();
    });

    it('should apply yellow color for high progress (>=75%)', () => {
      const { container } = render(
        <AchievementCard achievement={unearnedWithProgress} />,
      );

      const progressFill = container.querySelector('.bg-yellow-500');
      expect(progressFill).toBeTruthy();
    });

    it('should apply blue color for medium progress (>=50%)', () => {
      const { container } = render(
        <AchievementCard achievement={unearnedMidProgress} />,
      );

      const progressFill = container.querySelector('.bg-blue-500');
      expect(progressFill).toBeTruthy();
    });

    it('should apply gray color for low progress (<50%)', () => {
      const { container } = render(
        <AchievementCard achievement={unearnedLowProgress} />,
      );

      const progressFill = container.querySelector('.bg-gray-400');
      expect(progressFill).toBeTruthy();
    });

    it('should show progress label for sessions achievements', () => {
      render(<AchievementCard achievement={unearnedLowProgress} />);

      expect(screen.getByText('200/1000 sessions')).toBeTruthy();
      expect(screen.getByText('20%')).toBeTruthy();
    });

    it('should show progress label for streak achievements', () => {
      render(<AchievementCard achievement={unearnedMidProgress} />);

      expect(screen.getByText('18/30 days')).toBeTruthy();
      expect(screen.getByText('60%')).toBeTruthy();
    });
  });
});
