import { describe, it, expect } from 'vitest';
import { terminalCommandsChallenges } from '../seed-terminal-commands';
import type { NewChallenge } from '../schema';

describe('Terminal Commands seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 30 challenges', () => {
      expect(terminalCommandsChallenges.length).toBe(30);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      terminalCommandsChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      terminalCommandsChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType bash for all challenges', () => {
      terminalCommandsChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have bash syntaxType`
        ).toBe('bash');
      });
    });

    it('should have hints for all challenges', () => {
      terminalCommandsChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('terminal command coverage', () => {
    const getCommandsByPrefix = (prefix: string) =>
      terminalCommandsChallenges.filter((c) => c.content.startsWith(prefix));

    it('should have cd challenges', () => {
      const cdChallenges = getCommandsByPrefix('cd');
      expect(cdChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have ls challenges', () => {
      const lsChallenges = getCommandsByPrefix('ls');
      expect(lsChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have find challenges', () => {
      const findChallenges = getCommandsByPrefix('find');
      expect(findChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have grep challenges', () => {
      const grepChallenges = getCommandsByPrefix('grep');
      expect(grepChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have cat challenges', () => {
      const catChallenges = getCommandsByPrefix('cat');
      expect(catChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have head challenges', () => {
      const headChallenges = getCommandsByPrefix('head');
      expect(headChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have tail challenges', () => {
      const tailChallenges = getCommandsByPrefix('tail');
      expect(tailChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have pipe challenges', () => {
      const pipeChallenges = terminalCommandsChallenges.filter((c) => c.content.includes('|'));
      expect(pipeChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have redirect challenges', () => {
      const redirectChallenges = terminalCommandsChallenges.filter((c) =>
        c.content.includes('>') || c.content.includes('>>')
      );
      expect(redirectChallenges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = terminalCommandsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = terminalCommandsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = terminalCommandsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have more beginner challenges than advanced', () => {
      const beginnerCount = terminalCommandsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const advancedCount = terminalCommandsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;
      expect(beginnerCount).toBeGreaterThan(advancedCount);
    });
  });

  describe('content validity', () => {
    it('should have no duplicate content', () => {
      const contents = terminalCommandsChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      terminalCommandsChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(2); // minimum "ls"
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      terminalCommandsChallenges.forEach((challenge) => {
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
