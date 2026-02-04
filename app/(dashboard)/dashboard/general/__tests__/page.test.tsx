/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useActionState
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: vi.fn(() => [{}, vi.fn(), false]),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/dashboard/general'),
}));

// Mock SWR
const mockSWRData: Record<string, unknown> = {};
vi.mock('swr', () => ({
  default: vi.fn((key: string) => ({ data: mockSWRData[key] })),
  mutate: vi.fn(),
}));

// Mock actions
vi.mock('@/app/(login)/actions', () => ({
  updateAccount: vi.fn(),
}));

import GeneralPage from '../page';

describe('GeneralPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset SWR mocks
    mockSWRData['/api/user'] = { id: 1, name: 'Test User', email: 'test@test.com' };
    mockSWRData['/api/achievements'] = undefined;
    mockSWRData['/api/user/profile'] = {
      avatarUrl: null,
      bio: null,
      preferredCategoryIds: [],
    };
    mockSWRData['/api/categories?includeProgress=false'] = {
      categories: [
        { id: 1, name: 'Git Commands', slug: 'git', icon: 'git-branch' },
        { id: 2, name: 'Docker', slug: 'docker', icon: 'box' },
      ],
    };
  });

  it('should render the page title', () => {
    render(<GeneralPage />);
    expect(screen.getByText('General Settings')).toBeTruthy();
  });

  it('should render the Account Information card', () => {
    render(<GeneralPage />);
    expect(screen.getByText('Account Information')).toBeTruthy();
  });

  it('should render the Your Badges card', () => {
    render(<GeneralPage />);
    expect(screen.getByText('Your Badges')).toBeTruthy();
  });

  it('should render badges when achievement data is available', () => {
    mockSWRData['/api/achievements'] = [
      {
        id: 1,
        slug: 'speed-50',
        name: 'Warming Up',
        icon: 'gauge',
        earnedAt: '2025-06-15T12:00:00Z',
      },
      {
        id: 2,
        slug: 'speed-100',
        name: 'Speed Demon',
        icon: 'zap',
        earnedAt: null,
      },
    ];

    render(<GeneralPage />);

    expect(screen.getByTestId('profile-badges')).toBeTruthy();
    expect(screen.getByText('1/2')).toBeTruthy();
  });

  it('should not render badges section when no achievement data', () => {
    mockSWRData['/api/achievements'] = undefined;

    render(<GeneralPage />);

    // The card should still exist, but the inner component returns null
    expect(screen.getByText('Your Badges')).toBeTruthy();
    expect(screen.queryByTestId('profile-badges')).toBeNull();
  });

  it('should render the Profile card', () => {
    render(<GeneralPage />);
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('should render avatar URL input', () => {
    render(<GeneralPage />);
    expect(screen.getByLabelText('Avatar URL')).toBeTruthy();
  });

  it('should render bio textarea', () => {
    render(<GeneralPage />);
    expect(screen.getByLabelText('Bio')).toBeTruthy();
  });

  it('should render category chips when categories are loaded', () => {
    render(<GeneralPage />);
    expect(screen.getByText('Git Commands')).toBeTruthy();
    expect(screen.getByText('Docker')).toBeTruthy();
  });

  it('should render Save Profile button', () => {
    render(<GeneralPage />);
    expect(screen.getByText('Save Profile')).toBeTruthy();
  });

  it('should populate profile fields from API data', () => {
    mockSWRData['/api/user/profile'] = {
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Test bio content',
      preferredCategoryIds: [1],
    };

    render(<GeneralPage />);
    const avatarInput = screen.getByLabelText('Avatar URL') as HTMLInputElement;
    expect(avatarInput.value).toBe('https://example.com/avatar.png');

    const bioTextarea = screen.getByLabelText('Bio') as HTMLTextAreaElement;
    expect(bioTextarea.value).toBe('Test bio content');
  });
});
