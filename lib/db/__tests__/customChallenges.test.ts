import { describe, it, expect } from 'vitest';
import {
  customChallenges,
  type CustomChallenge,
  type NewCustomChallenge,
} from '../schema';

describe('customChallenges schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (customChallenges as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(customChallenges).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('custom_challenges');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(customChallenges);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('userId');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('content');
      expect(columnNames).toContain('isPublic');
      expect(columnNames).toContain('forkedFromId');
      expect(columnNames).toContain('timesCompleted');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(customChallenges.id.primary).toBe(true);
    });

    it('should have userId as not null', () => {
      expect(customChallenges.userId.notNull).toBe(true);
    });

    it('should have name as not null', () => {
      expect(customChallenges.name.notNull).toBe(true);
    });

    it('should have content as not null', () => {
      expect(customChallenges.content.notNull).toBe(true);
    });
  });

  describe('column defaults', () => {
    it('should default isPublic to false', () => {
      expect(customChallenges.isPublic.default).toBe(false);
    });

    it('should default timesCompleted to 0', () => {
      expect(customChallenges.timesCompleted.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewCustomChallenge object', () => {
      const newChallenge: NewCustomChallenge = {
        userId: 1,
        name: 'My Git Workflow',
        content: 'git add . && git commit -m "update" && git push',
        isPublic: true,
        timesCompleted: 5,
      };

      expect(newChallenge.userId).toBe(1);
      expect(newChallenge.name).toBe('My Git Workflow');
      expect(newChallenge.content).toBe(
        'git add . && git commit -m "update" && git push'
      );
      expect(newChallenge.isPublic).toBe(true);
      expect(newChallenge.timesCompleted).toBe(5);
    });

    it('should allow NewCustomChallenge with only required fields', () => {
      const minimalChallenge: NewCustomChallenge = {
        userId: 1,
        name: 'Simple Challenge',
        content: 'echo "hello world"',
      };

      expect(minimalChallenge.userId).toBe(1);
      expect(minimalChallenge.name).toBe('Simple Challenge');
      expect(minimalChallenge.content).toBe('echo "hello world"');
      expect(minimalChallenge.isPublic).toBeUndefined();
      expect(minimalChallenge.timesCompleted).toBeUndefined();
    });

    it('should infer CustomChallenge type with all fields', () => {
      const challenge: CustomChallenge = {
        id: 1,
        userId: 1,
        name: 'Docker Commands',
        content: 'docker build -t myapp .',
        isPublic: false,
        forkedFromId: null,
        timesCompleted: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(challenge.id).toBe(1);
      expect(challenge.userId).toBe(1);
      expect(challenge.name).toBe('Docker Commands');
      expect(challenge.forkedFromId).toBeNull();
      expect(typeof challenge.createdAt).toBe('object');
      expect(challenge.createdAt instanceof Date).toBe(true);
    });
  });

  describe('isPublic field', () => {
    it('should allow true value', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Public Challenge',
        content: 'npm install',
        isPublic: true,
      };
      expect(challenge.isPublic).toBe(true);
    });

    it('should allow false value', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Private Challenge',
        content: 'npm install',
        isPublic: false,
      };
      expect(challenge.isPublic).toBe(false);
    });
  });

  describe('forkedFromId field', () => {
    it('should allow null forkedFromId for original challenges', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Original Challenge',
        content: 'npm install',
        forkedFromId: null,
      };
      expect(challenge.forkedFromId).toBeNull();
    });

    it('should allow a numeric forkedFromId for forked challenges', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Forked Challenge',
        content: 'npm install',
        forkedFromId: 42,
      };
      expect(challenge.forkedFromId).toBe(42);
    });

    it('should default forkedFromId to undefined when not set', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Challenge without fork info',
        content: 'npm install',
      };
      expect(challenge.forkedFromId).toBeUndefined();
    });
  });

  describe('timesCompleted field', () => {
    it('should allow zero timesCompleted', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'New Challenge',
        content: 'test',
        timesCompleted: 0,
      };
      expect(challenge.timesCompleted).toBe(0);
    });

    it('should allow positive timesCompleted', () => {
      const challenge: NewCustomChallenge = {
        userId: 1,
        name: 'Popular Challenge',
        content: 'test',
        timesCompleted: 500,
      };
      expect(challenge.timesCompleted).toBe(500);
    });
  });
});
