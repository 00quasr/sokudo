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
              return [{ id: 1, name: 'Test Collection' }];
            },
          };
        },
      };
    },
    select: (...sArgs: unknown[]) => {
      mockSelect(...sArgs);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return [{ id: 1, userId: 1, name: 'Existing', isPublic: true, count: 3 }];
            },
            orderBy: () => ({
              where: (...wArgs: unknown[]) => {
                mockWhere(...wArgs);
                return [{ id: 1 }];
              },
            }),
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
  createCollection,
  updateCollection,
  deleteCollection,
  addChallengeToCollection,
  removeChallengeFromCollection,
} from '../actions';

describe('Collection Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCollection', () => {
    it('should validate that name is required', async () => {
      const formData = new FormData();
      formData.set('name', '');

      const result = await createCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should create a collection with valid data', async () => {
      const formData = new FormData();
      formData.set('name', 'Git Essentials');
      formData.set('description', 'A collection of git challenges');

      const result = await createCollection({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          name: 'Git Essentials',
          description: 'A collection of git challenges',
          isPublic: false,
        })
      );
    });

    it('should handle isPublic flag', async () => {
      const formData = new FormData();
      formData.set('name', 'Public Collection');
      formData.set('isPublic', 'on');

      const result = await createCollection({}, formData);
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

      const result = await createCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should return collectionId on success', async () => {
      const formData = new FormData();
      formData.set('name', 'Test');

      const result = await createCollection({}, formData);
      expect(result).toHaveProperty('collectionId', 1);
    });
  });

  describe('updateCollection', () => {
    it('should validate that id is required', async () => {
      const formData = new FormData();
      formData.set('id', '');
      formData.set('name', 'Updated');

      const result = await updateCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should update a collection with valid data', async () => {
      const formData = new FormData();
      formData.set('id', '1');
      formData.set('name', 'Updated Collection');
      formData.set('description', 'Updated description');

      const result = await updateCollection({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should validate description max length', async () => {
      const formData = new FormData();
      formData.set('id', '1');
      formData.set('name', 'Test');
      formData.set('description', 'a'.repeat(1001));

      const result = await updateCollection({}, formData);
      expect(result).toHaveProperty('error');
    });
  });

  describe('deleteCollection', () => {
    it('should validate that id is required', async () => {
      const formData = new FormData();
      formData.set('id', '');

      const result = await deleteCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should delete a collection with valid id', async () => {
      const formData = new FormData();
      formData.set('id', '1');

      const result = await deleteCollection({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('addChallengeToCollection', () => {
    it('should validate that collectionId is required', async () => {
      const formData = new FormData();
      formData.set('collectionId', '');
      formData.set('challengeId', '1');

      const result = await addChallengeToCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should validate that challengeId is required', async () => {
      const formData = new FormData();
      formData.set('collectionId', '1');
      formData.set('challengeId', '');

      const result = await addChallengeToCollection({}, formData);
      expect(result).toHaveProperty('error');
    });
  });

  describe('removeChallengeFromCollection', () => {
    it('should validate that collectionId is required', async () => {
      const formData = new FormData();
      formData.set('collectionId', '');
      formData.set('challengeId', '1');

      const result = await removeChallengeFromCollection({}, formData);
      expect(result).toHaveProperty('error');
    });

    it('should remove a challenge with valid ids', async () => {
      const formData = new FormData();
      formData.set('collectionId', '1');
      formData.set('challengeId', '5');

      const result = await removeChallengeFromCollection({}, formData);
      expect(result).toHaveProperty('success');
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
