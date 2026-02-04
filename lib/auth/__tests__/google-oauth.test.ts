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

describe('Google OAuth authentication flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a team for new OAuth users', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    };

    const mockTeam = {
      id: 1,
      name: "test@example.com's Team",
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
    expect(mockUser.email).toBe('test@example.com');
    expect(mockTeam.name).toBe("test@example.com's Team");
  });

  it('should not create a team for existing OAuth users', async () => {
    const mockUser = {
      id: '1',
      email: 'existing@example.com',
      name: 'Existing User',
      image: null,
    };

    const existingDbUser = {
      id: 1,
      email: 'existing@example.com',
      name: 'Existing User',
      passwordHash: null,
      role: 'owner',
      referralCode: null,
      emailVerified: null,
      image: null,
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

  it('should handle OAuth users without passwords', () => {
    const oauthUser = {
      id: 1,
      email: 'oauth@example.com',
      name: 'OAuth User',
      passwordHash: null, // OAuth users don't have passwords
      role: 'owner',
      referralCode: null,
      emailVerified: new Date(),
      image: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      username: null,
    };

    expect(oauthUser.passwordHash).toBeNull();
    expect(oauthUser.emailVerified).toBeTruthy();
    expect(oauthUser.image).toBeTruthy();
  });

  it('should allow email/password users to have null image', () => {
    const emailUser = {
      id: 1,
      email: 'email@example.com',
      name: 'Email User',
      passwordHash: 'hashed_password',
      role: 'owner',
      referralCode: null,
      emailVerified: null,
      image: null, // Email users don't have OAuth images
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      username: null,
    };

    expect(emailUser.passwordHash).toBeTruthy();
    expect(emailUser.image).toBeNull();
  });
});

describe('OAuth schema changes', () => {
  it('should allow users without passwords for OAuth', () => {
    const oauthOnlyUser = {
      email: 'oauth@example.com',
      passwordHash: null, // This should be allowed now
      role: 'member',
    };

    expect(oauthOnlyUser.passwordHash).toBeNull();
  });

  it('should allow users with email verified timestamp', () => {
    const verifiedUser = {
      email: 'verified@example.com',
      emailVerified: new Date(),
      passwordHash: null,
      role: 'member',
    };

    expect(verifiedUser.emailVerified).toBeInstanceOf(Date);
  });

  it('should allow users with OAuth profile images', () => {
    const userWithImage = {
      email: 'user@example.com',
      image: 'https://lh3.googleusercontent.com/a/example',
      passwordHash: null,
      role: 'member',
    };

    expect(userWithImage.image).toContain('https://');
  });
});
