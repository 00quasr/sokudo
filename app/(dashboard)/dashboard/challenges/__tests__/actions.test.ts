import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock drizzle db
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return {
            returning: () => {
              mockReturning();
              return [{ id: 1, name: 'Test', content: 'test content' }];
            },
          };
        },
      };
    },
    select: () => {
      mockSelect();
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return [{ id: 1, userId: 1, name: 'Existing', content: 'old' }];
            },
          };
        },
      };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return {
        set: (...sArgs: unknown[]) => {
          mockSet(...sArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return Promise.resolve();
            },
          };
        },
      };
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return {
        where: (...wArgs: unknown[]) => {
          mockWhere(...wArgs);
          return Promise.resolve();
        },
      };
    },
  },
}));

// Mock getUser to return a valid user
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(() =>
    Promise.resolve({
      id: 1,
      name: 'Test User',
      email: 'test@test.com',
      role: 'member',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  ),
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-session-token' })),
  })),
}));

// Mock session verification
vi.mock('@/lib/auth/session', () => ({
  verifyToken: vi.fn(() =>
    Promise.resolve({
      user: { id: 1 },
      expires: new Date(Date.now() + 86400000).toISOString(),
    })
  ),
}));

import {
  createCustomChallenge,
  updateCustomChallenge,
  deleteCustomChallenge,
  forkChallenge,
} from '../actions';

describe('Custom Challenge Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCustomChallenge', () => {
    it('should validate that name is required', async () => {
      const formData = new FormData();
      formData.set('name', '');
      formData.set('content', 'some content');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should validate that content is required', async () => {
      const formData = new FormData();
      formData.set('name', 'Test Challenge');
      formData.set('content', '');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should create a challenge with valid data', async () => {
      const formData = new FormData();
      formData.set('name', 'Git Commands');
      formData.set('content', 'git add . && git commit -m "test"');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          name: 'Git Commands',
          content: 'git add . && git commit -m "test"',
          isPublic: false,
        })
      );
    });

    it('should handle isPublic checkbox', async () => {
      const formData = new FormData();
      formData.set('name', 'Public Challenge');
      formData.set('content', 'npm install');
      formData.set('isPublic', 'on');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true,
        })
      );
    });

    it('should validate name max length', async () => {
      const formData = new FormData();
      formData.set('name', 'a'.repeat(256));
      formData.set('content', 'some content');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should reject content that is too short', async () => {
      const formData = new FormData();
      formData.set('name', 'Test');
      formData.set('content', 'a');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should reject whitespace-only content', async () => {
      const formData = new FormData();
      formData.set('name', 'Test');
      formData.set('content', '   ');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should reject content with control characters', async () => {
      const formData = new FormData();
      formData.set('name', 'Test');
      formData.set('content', 'hello\x00world');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should include warning for unbalanced brackets', async () => {
      const formData = new FormData();
      formData.set('name', 'Test');
      formData.set('content', 'function(a, b');

      const result = await createCustomChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect((result as { success: string }).success).toContain('Warning');
    });
  });

  describe('updateCustomChallenge', () => {
    it('should validate that id is required', async () => {
      const formData = new FormData();
      formData.set('id', '');
      formData.set('name', 'Updated');
      formData.set('content', 'updated content');

      const result = await updateCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should update a challenge with valid data', async () => {
      const formData = new FormData();
      formData.set('id', '1');
      formData.set('name', 'Updated Challenge');
      formData.set('content', 'updated content');

      const result = await updateCustomChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reject content with control characters on update', async () => {
      const formData = new FormData();
      formData.set('id', '1');
      formData.set('name', 'Updated');
      formData.set('content', 'test\x07beep');

      const result = await updateCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should reject too-short content on update', async () => {
      const formData = new FormData();
      formData.set('id', '1');
      formData.set('name', 'Updated');
      formData.set('content', 'x');

      const result = await updateCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });
  });

  describe('deleteCustomChallenge', () => {
    it('should validate that id is required', async () => {
      const formData = new FormData();
      formData.set('id', '');

      const result = await deleteCustomChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should delete a challenge with valid id', async () => {
      const formData = new FormData();
      formData.set('id', '1');

      const result = await deleteCustomChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('forkChallenge', () => {
    it('should validate that challengeId is required', async () => {
      const formData = new FormData();
      formData.set('challengeId', '');

      const result = await forkChallenge({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should fork a public challenge with valid id', async () => {
      const formData = new FormData();
      formData.set('challengeId', '1');

      const result = await forkChallenge({}, formData);
      expect(result).toHaveProperty('success');
      expect((result as { success: string }).success).toBe('Challenge forked successfully.');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          name: 'Existing',
          content: 'old',
          isPublic: false,
          forkedFromId: 1,
        })
      );
    });

    it('should return error for invalid (non-numeric) challengeId', async () => {
      const formData = new FormData();
      formData.set('challengeId', 'abc');

      const result = await forkChallenge({}, formData);
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toBe('Invalid challenge ID.');
    });

    it('should return challengeId in success response', async () => {
      const formData = new FormData();
      formData.set('challengeId', '1');

      const result = await forkChallenge({}, formData);
      expect(result).toHaveProperty('challengeId', 1);
    });
  });
});
