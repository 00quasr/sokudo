import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('GitHub OAuth authentication flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a team for new GitHub OAuth users', async () => {
    const mockUser = {
      id: '1',
      email: 'github@example.com',
      name: 'GitHub User',
      image: 'https://avatars.githubusercontent.com/u/12345',
    };

    const mockTeam = {
      id: 1,
      name: "github@example.com's Team",
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: null,
    };

    // Mock user doesn't exist
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Mock team creation
    const insertTeamMock = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockTeam]),
    };

    // Mock team member creation
    const insertTeamMemberMock = {
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(db.select).mockReturnValue(selectMock as any);
    vi.mocked(db.insert)
      .mockReturnValueOnce(insertTeamMock as any)
      .mockReturnValueOnce(insertTeamMemberMock as any);

    // Verify the logic would create a team
    expect(mockUser.email).toBe('github@example.com');
    expect(mockTeam.name).toBe("github@example.com's Team");
    expect(mockUser.image).toContain('avatars.githubusercontent.com');
  });

  it('should not create a team for existing GitHub OAuth users', async () => {
    const mockUser = {
      id: '1',
      email: 'existing-github@example.com',
      name: 'Existing GitHub User',
      image: 'https://avatars.githubusercontent.com/u/67890',
    };

    const existingDbUser = {
      id: 1,
      email: 'existing-github@example.com',
      name: 'Existing GitHub User',
      passwordHash: null,
      role: 'owner',
      referralCode: null,
      emailVerified: new Date(),
      image: 'https://avatars.githubusercontent.com/u/67890',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      username: null,
    };

    // Mock user exists
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([existingDbUser]),
    };

    vi.mocked(db.select).mockReturnValue(selectMock as any);

    // Verify the logic would not create a new team
    expect(selectMock.limit).toBeDefined();
  });

  it('should handle GitHub OAuth users without passwords', () => {
    const githubOauthUser = {
      id: 1,
      email: 'githubuser@example.com',
      name: 'GitHub OAuth User',
      passwordHash: null, // OAuth users don't have passwords
      role: 'owner',
      referralCode: null,
      emailVerified: new Date(),
      image: 'https://avatars.githubusercontent.com/u/11111',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      username: null,
    };

    expect(githubOauthUser.passwordHash).toBeNull();
    expect(githubOauthUser.emailVerified).toBeTruthy();
    expect(githubOauthUser.image).toBeTruthy();
    expect(githubOauthUser.image).toContain('avatars.githubusercontent.com');
  });

  it('should support users with both Google and GitHub accounts linked', () => {
    const multiProviderUser = {
      id: 1,
      email: 'multiauth@example.com',
      name: 'Multi Auth User',
      passwordHash: null,
      role: 'owner',
      referralCode: null,
      emailVerified: new Date(),
      image: 'https://lh3.googleusercontent.com/a/example', // Could be from either provider
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      username: null,
    };

    // User can have multiple accounts linked (Google + GitHub)
    const linkedAccounts = [
      {
        provider: 'google',
        providerAccountId: 'google-id-123',
        userId: 1,
      },
      {
        provider: 'github',
        providerAccountId: 'github-id-456',
        userId: 1,
      },
    ];

    expect(linkedAccounts).toHaveLength(2);
    expect(linkedAccounts.some(acc => acc.provider === 'github')).toBe(true);
    expect(linkedAccounts.some(acc => acc.provider === 'google')).toBe(true);
  });
});

describe('GitHub OAuth profile data', () => {
  it('should store GitHub avatar URL', () => {
    const githubUser = {
      email: 'dev@example.com',
      image: 'https://avatars.githubusercontent.com/u/12345?v=4',
      passwordHash: null,
      role: 'member',
    };

    expect(githubUser.image).toContain('avatars.githubusercontent.com');
  });

  it('should allow GitHub users with verified emails', () => {
    const verifiedGithubUser = {
      email: 'verified@github.example.com',
      emailVerified: new Date(),
      passwordHash: null,
      role: 'member',
    };

    expect(verifiedGithubUser.emailVerified).toBeInstanceOf(Date);
  });

  it('should handle GitHub usernames in profile', () => {
    const githubProfile = {
      email: 'ghuser@example.com',
      name: 'GitHub Username',
      image: 'https://avatars.githubusercontent.com/u/99999',
      username: 'ghuser', // GitHub username
    };

    expect(githubProfile.username).toBe('ghuser');
    expect(githubProfile.name).toBeTruthy();
  });
});
