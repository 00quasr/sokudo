/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/queries', () => ({
  getUserAchievements: vi.fn(),
}));

import { getUserAchievements } from '@/lib/db/queries';
import AchievementsPage from '../page';

const mockAchievements = [
  {
    id: 1,
    slug: 'speed-50',
    name: 'Warming Up',
    description: 'Reach 50 WPM in any session',
    icon: 'gauge',
    criteria: { type: 'wpm', threshold: 50 },
    earnedAt: new Date('2025-06-15T12:00:00Z'),
  },
  {
    id: 2,
    slug: 'speed-60',
    name: 'Getting Fast',
    description: 'Reach 60 WPM in any session',
    icon: 'gauge',
    criteria: { type: 'wpm', threshold: 60 },
    earnedAt: null,
  },
  {
    id: 3,
    slug: 'accuracy-95',
    name: 'Sharpshooter',
    description: 'Achieve 95% accuracy in a session',
    icon: 'target',
    criteria: { type: 'accuracy', threshold: 95 },
    earnedAt: new Date('2025-06-16T12:00:00Z'),
  },
  {
    id: 4,
    slug: 'streak-3',
    name: 'Getting Started',
    description: 'Practice for 3 consecutive days',
    icon: 'flame',
    criteria: { type: 'streak', threshold: 3 },
    earnedAt: null,
  },
  {
    id: 5,
    slug: 'sessions-100',
    name: 'Centurion',
    description: 'Complete 100 typing sessions',
    icon: 'trophy',
    criteria: { type: 'sessions_completed', threshold: 100 },
    earnedAt: null,
  },
  {
    id: 6,
    slug: 'mastery-git-basics',
    name: 'Git Beginner',
    description: 'Complete all Git Basics challenges with 90%+ accuracy',
    icon: 'git-branch',
    criteria: { type: 'category_mastery', categorySlug: 'git-basics', minAccuracy: 90, allChallenges: true },
    earnedAt: null,
  },
];

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Achievements')).toBeTruthy();
  });

  it('should display earned count', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Earned')).toBeTruthy();
    // 2 earned out of 6
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('/6')).toBeTruthy();
  });

  it('should display completion percentage', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Completion')).toBeTruthy();
    // 2/6 = 33%
    expect(screen.getByText('33%')).toBeTruthy();
  });

  it('should display remaining count', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Remaining')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('should group achievements by category', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Speed')).toBeTruthy();
    expect(screen.getByText('Accuracy')).toBeTruthy();
    expect(screen.getByText('Streak')).toBeTruthy();
    expect(screen.getByText('Practice')).toBeTruthy();
    expect(screen.getByText('Mastery')).toBeTruthy();
  });

  it('should display achievement names', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Warming Up')).toBeTruthy();
    expect(screen.getByText('Getting Fast')).toBeTruthy();
    expect(screen.getByText('Sharpshooter')).toBeTruthy();
    expect(screen.getByText('Getting Started')).toBeTruthy();
    expect(screen.getByText('Centurion')).toBeTruthy();
    expect(screen.getByText('Git Beginner')).toBeTruthy();
  });

  it('should render achievement cards', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue(mockAchievements);

    const page = await AchievementsPage();
    render(page);

    const cards = screen.getAllByTestId('achievement-card');
    expect(cards.length).toBe(6);
  });

  it('should show empty state when no achievements exist', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue([]);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('No achievements available')).toBeTruthy();
  });

  it('should not show categories when no achievements exist', async () => {
    vi.mocked(getUserAchievements).mockResolvedValue([]);

    const page = await AchievementsPage();
    render(page);

    expect(screen.queryByText('Speed')).toBeNull();
    expect(screen.queryByText('Accuracy')).toBeNull();
    expect(screen.queryByText('Earned')).toBeNull();
  });

  it('should show 100% completion when all earned', async () => {
    const allEarned = mockAchievements.map((a) => ({
      ...a,
      earnedAt: new Date('2025-06-15T12:00:00Z'),
    }));
    vi.mocked(getUserAchievements).mockResolvedValue(allEarned);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy(); // 0 remaining
  });

  it('should skip empty categories', async () => {
    // Only wpm achievements
    const wpmOnly = mockAchievements.filter(
      (a) => (a.criteria as { type: string }).type === 'wpm',
    );
    vi.mocked(getUserAchievements).mockResolvedValue(wpmOnly);

    const page = await AchievementsPage();
    render(page);

    expect(screen.getByText('Speed')).toBeTruthy();
    expect(screen.queryByText('Accuracy')).toBeNull();
    expect(screen.queryByText('Streak')).toBeNull();
  });
});
