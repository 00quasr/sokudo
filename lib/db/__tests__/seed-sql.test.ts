import { describe, it, expect } from 'vitest';
import { sqlChallenges } from '../seed-sql';
import type { NewChallenge } from '../schema';

describe('SQL seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 20 challenges', () => {
      expect(sqlChallenges.length).toBe(20);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      sqlChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      sqlChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType sql for all challenges', () => {
      sqlChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have sql syntaxType`
        ).toBe('sql');
      });
    });

    it('should have hints for all challenges', () => {
      sqlChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('SQL command coverage', () => {
    const getChallengesContaining = (keyword: string) =>
      sqlChallenges.filter((c) => c.content.toUpperCase().includes(keyword.toUpperCase()));

    it('should have SELECT challenges', () => {
      const selectChallenges = getChallengesContaining('SELECT');
      expect(selectChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have WHERE challenges', () => {
      const whereChallenges = getChallengesContaining('WHERE');
      expect(whereChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have JOIN challenges', () => {
      const joinChallenges = getChallengesContaining('JOIN');
      expect(joinChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have GROUP BY challenges', () => {
      const groupByChallenges = getChallengesContaining('GROUP BY');
      expect(groupByChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have INDEX challenges', () => {
      const indexChallenges = getChallengesContaining('INDEX');
      expect(indexChallenges.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = sqlChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = sqlChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = sqlChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });
  });

  describe('content validity', () => {
    it('should have all challenges end with semicolon', () => {
      sqlChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.endsWith(';'),
          `Challenge ${index + 1} should end with semicolon: ${challenge.content}`
        ).toBe(true);
      });
    });

    it('should have no duplicate content', () => {
      const contents = sqlChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      sqlChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(10);
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(150);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      sqlChallenges.forEach((challenge) => {
        const fullChallenge: NewChallenge = {
          ...challenge,
          categoryId: 1, // This would be set during actual seeding
        };

        expect(fullChallenge.categoryId).toBe(1);
        expect(fullChallenge.content).toBe(challenge.content);
        expect(fullChallenge.difficulty).toBe(challenge.difficulty);
        expect(fullChallenge.syntaxType).toBe(challenge.syntaxType);
        expect(fullChallenge.hint).toBe(challenge.hint);
      });
    });
  });
});
