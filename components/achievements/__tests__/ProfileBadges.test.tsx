/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileBadges, type ProfileBadge } from '../ProfileBadges';

const earnedBadges: ProfileBadge[] = [
  {
    id: 1,
    slug: 'speed-50',
    name: 'Warming Up',
    icon: 'gauge',
    earnedAt: new Date('2025-06-15T12:00:00Z'),
  },
  {
    id: 2,
    slug: 'streak-7',
    name: 'Week Warrior',
    icon: 'flame',
    earnedAt: new Date('2025-06-20T12:00:00Z'),
  },
];

const mixedBadges: ProfileBadge[] = [
  ...earnedBadges,
  {
    id: 3,
    slug: 'speed-100',
    name: 'Speed Demon',
    icon: 'zap',
    earnedAt: null,
  },
  {
    id: 4,
    slug: 'accuracy-99',
    name: 'Perfectionist',
    icon: 'target',
    earnedAt: null,
  },
];

const allUnearned: ProfileBadge[] = [
  {
    id: 1,
    slug: 'speed-50',
    name: 'Warming Up',
    icon: 'gauge',
    earnedAt: null,
  },
  {
    id: 2,
    slug: 'streak-7',
    name: 'Week Warrior',
    icon: 'flame',
    earnedAt: null,
  },
];

describe('ProfileBadges', () => {
  it('should render the badges container', () => {
    render(<ProfileBadges badges={earnedBadges} totalAchievements={10} />);

    expect(screen.getByTestId('profile-badges')).toBeTruthy();
  });

  it('should display the header with badge count', () => {
    render(<ProfileBadges badges={earnedBadges} totalAchievements={10} />);

    expect(screen.getByText('Badges')).toBeTruthy();
    expect(screen.getByText('2/10')).toBeTruthy();
  });

  it('should display a "View all" link to achievements page', () => {
    render(<ProfileBadges badges={earnedBadges} totalAchievements={10} />);

    const link = screen.getByText('View all');
    expect(link).toBeTruthy();
    expect(link.closest('a')?.getAttribute('href')).toBe(
      '/dashboard/achievements'
    );
  });

  it('should render earned badges as icons', () => {
    render(<ProfileBadges badges={earnedBadges} totalAchievements={10} />);

    const badgeList = screen.getByTestId('profile-badges-list');
    expect(badgeList).toBeTruthy();
    // Should have 2 badge icon circles
    const badges = badgeList.querySelectorAll('[title]');
    expect(badges.length).toBe(2);
    expect(badges[0].getAttribute('title')).toBe('Warming Up');
    expect(badges[1].getAttribute('title')).toBe('Week Warrior');
  });

  it('should only display earned badges, not unearned ones', () => {
    render(<ProfileBadges badges={mixedBadges} totalAchievements={10} />);

    const badgeList = screen.getByTestId('profile-badges-list');
    const badges = badgeList.querySelectorAll('[title]');
    expect(badges.length).toBe(2);
    // Unearned badges should not appear
    const titles = Array.from(badges).map((b) => b.getAttribute('title'));
    expect(titles).toContain('Warming Up');
    expect(titles).toContain('Week Warrior');
    expect(titles).not.toContain('Speed Demon');
    expect(titles).not.toContain('Perfectionist');
  });

  it('should show empty state when no badges are earned', () => {
    render(<ProfileBadges badges={allUnearned} totalAchievements={10} />);

    expect(screen.getByTestId('profile-badges-empty')).toBeTruthy();
    expect(
      screen.getByText(/No badges earned yet/)
    ).toBeTruthy();
  });

  it('should show empty state with zero earned count', () => {
    render(<ProfileBadges badges={allUnearned} totalAchievements={10} />);

    expect(screen.getByText('0/10')).toBeTruthy();
  });

  it('should not render the badge list when empty', () => {
    render(<ProfileBadges badges={allUnearned} totalAchievements={10} />);

    expect(screen.queryByTestId('profile-badges-list')).toBeNull();
  });

  it('should handle empty badges array', () => {
    render(<ProfileBadges badges={[]} totalAchievements={0} />);

    expect(screen.getByTestId('profile-badges-empty')).toBeTruthy();
    expect(screen.getByText('0/0')).toBeTruthy();
  });
});
