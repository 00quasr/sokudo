import { describe, it, expect } from 'vitest';
import { users, type User, type NewUser } from '../schema';

describe('users OAuth provider fields', () => {
  describe('table structure', () => {
    it('should have provider column', () => {
      const columnNames = Object.keys(users);
      expect(columnNames).toContain('provider');
    });

    it('should have providerId column', () => {
      const columnNames = Object.keys(users);
      expect(columnNames).toContain('providerId');
    });

    it('should have providerData column', () => {
      const columnNames = Object.keys(users);
      expect(columnNames).toContain('providerData');
    });
  });

  describe('column constraints', () => {
    it('should allow provider to be null', () => {
      expect(users.provider.notNull).toBeFalsy();
    });

    it('should allow providerId to be null', () => {
      expect(users.providerId.notNull).toBeFalsy();
    });

    it('should allow providerData to be null', () => {
      expect(users.providerData.notNull).toBeFalsy();
    });
  });

  describe('type inference', () => {
    it('should allow NewUser with OAuth provider fields', () => {
      const newUser: NewUser = {
        email: 'oauth@example.com',
        name: 'OAuth User',
        provider: 'google',
        providerId: 'google-123456',
        providerData: {
          picture: 'https://lh3.googleusercontent.com/a/example',
          email_verified: true,
          locale: 'en',
        },
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.provider).toBe('google');
      expect(newUser.providerId).toBe('google-123456');
      expect(newUser.providerData).toEqual({
        picture: 'https://lh3.googleusercontent.com/a/example',
        email_verified: true,
        locale: 'en',
      });
    });

    it('should allow NewUser with GitHub provider fields', () => {
      const newUser: NewUser = {
        email: 'github@example.com',
        name: 'GitHub User',
        provider: 'github',
        providerId: 'github-789012',
        providerData: {
          avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          login: 'githubuser',
          bio: 'Developer',
        },
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.provider).toBe('github');
      expect(newUser.providerId).toBe('github-789012');
      expect(newUser.providerData).toEqual({
        avatar_url: 'https://avatars.githubusercontent.com/u/12345',
        login: 'githubuser',
        bio: 'Developer',
      });
    });

    it('should allow NewUser without OAuth provider fields', () => {
      const newUser: NewUser = {
        email: 'traditional@example.com',
        name: 'Traditional User',
        passwordHash: 'hashed-password',
      };

      expect(newUser.provider).toBeUndefined();
      expect(newUser.providerId).toBeUndefined();
      expect(newUser.providerData).toBeUndefined();
    });

    it('should allow User with all OAuth fields populated', () => {
      const user: User = {
        id: 1,
        email: 'oauth@example.com',
        name: 'OAuth User',
        username: null,
        passwordHash: null,
        role: 'owner',
        referralCode: null,
        emailVerified: new Date(),
        image: 'https://lh3.googleusercontent.com/a/example',
        provider: 'google',
        providerId: 'google-123456',
        providerData: {
          picture: 'https://lh3.googleusercontent.com/a/example',
          email_verified: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(user.provider).toBe('google');
      expect(user.providerId).toBe('google-123456');
      expect(user.providerData).toBeDefined();
    });

    it('should allow User with null OAuth fields', () => {
      const user: User = {
        id: 2,
        email: 'traditional@example.com',
        name: 'Traditional User',
        username: null,
        passwordHash: 'hashed-password',
        role: 'member',
        referralCode: null,
        emailVerified: null,
        image: null,
        provider: null,
        providerId: null,
        providerData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(user.provider).toBeNull();
      expect(user.providerId).toBeNull();
      expect(user.providerData).toBeNull();
    });
  });

  describe('OAuth provider field use cases', () => {
    it('should store Google OAuth profile data', () => {
      const googleProviderData = {
        sub: '1234567890',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://lh3.googleusercontent.com/a/example',
        email: 'john@example.com',
        email_verified: true,
        locale: 'en',
      };

      const newUser: NewUser = {
        email: 'john@example.com',
        name: 'John Doe',
        provider: 'google',
        providerId: '1234567890',
        providerData: googleProviderData,
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.providerData).toEqual(googleProviderData);
      expect((newUser.providerData as any).email_verified).toBe(true);
    });

    it('should store GitHub OAuth profile data', () => {
      const githubProviderData = {
        id: 12345678,
        login: 'johndoe',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
        name: 'John Doe',
        company: 'Example Corp',
        blog: 'https://johndoe.dev',
        location: 'San Francisco',
        bio: 'Full-stack developer',
        public_repos: 42,
        followers: 100,
        following: 50,
      };

      const newUser: NewUser = {
        email: 'johndoe@example.com',
        name: 'John Doe',
        provider: 'github',
        providerId: '12345678',
        providerData: githubProviderData,
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.providerData).toEqual(githubProviderData);
      expect((newUser.providerData as any).login).toBe('johndoe');
      expect((newUser.providerData as any).public_repos).toBe(42);
    });

    it('should support users with mixed authentication (OAuth + password)', () => {
      // User initially signed up with OAuth, later added password
      const user: User = {
        id: 3,
        email: 'mixed@example.com',
        name: 'Mixed Auth User',
        username: null,
        passwordHash: 'hashed-password', // Added later
        role: 'owner',
        referralCode: null,
        emailVerified: new Date(),
        image: 'https://lh3.googleusercontent.com/a/example',
        provider: 'google', // Original sign-up method
        providerId: 'google-original-id',
        providerData: {
          picture: 'https://lh3.googleusercontent.com/a/example',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(user.provider).toBe('google');
      expect(user.passwordHash).toBe('hashed-password');
    });

    it('should handle empty provider data object', () => {
      const newUser: NewUser = {
        email: 'minimal@example.com',
        name: 'Minimal User',
        provider: 'google',
        providerId: 'google-minimal',
        providerData: {},
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.providerData).toEqual({});
    });

    it('should handle complex nested provider data', () => {
      const complexProviderData = {
        profile: {
          name: 'John Doe',
          picture: 'https://example.com/pic.jpg',
          locale: 'en-US',
        },
        metadata: {
          created_at: '2024-01-01',
          last_login: '2024-12-01',
        },
        permissions: ['read', 'write'],
      };

      const newUser: NewUser = {
        email: 'complex@example.com',
        name: 'Complex User',
        provider: 'custom-oauth',
        providerId: 'custom-123',
        providerData: complexProviderData,
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.providerData).toEqual(complexProviderData);
      expect((newUser.providerData as any).profile.name).toBe('John Doe');
      expect((newUser.providerData as any).permissions).toHaveLength(2);
    });
  });

  describe('OAuth provider field validation', () => {
    it('should accept common OAuth provider names', () => {
      const providers = ['google', 'github', 'facebook', 'twitter', 'microsoft', 'apple'];

      providers.forEach((provider) => {
        const newUser: NewUser = {
          email: `${provider}@example.com`,
          name: `${provider} User`,
          provider: provider,
          providerId: `${provider}-123`,
          providerData: {},
          emailVerified: new Date(),
          passwordHash: null,
        };

        expect(newUser.provider).toBe(provider);
      });
    });

    it('should allow provider field up to 50 characters', () => {
      const longProvider = 'a'.repeat(50);
      const newUser: NewUser = {
        email: 'long@example.com',
        name: 'Long Provider User',
        provider: longProvider,
        providerId: 'long-123',
        providerData: {},
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.provider).toBe(longProvider);
      expect(newUser.provider?.length).toBe(50);
    });

    it('should allow providerId field up to 255 characters', () => {
      const longProviderId = 'b'.repeat(255);
      const newUser: NewUser = {
        email: 'longid@example.com',
        name: 'Long Provider ID User',
        provider: 'oauth',
        providerId: longProviderId,
        providerData: {},
        emailVerified: new Date(),
        passwordHash: null,
      };

      expect(newUser.providerId).toBe(longProviderId);
      expect(newUser.providerId?.length).toBe(255);
    });
  });
});
