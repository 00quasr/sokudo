import { describe, it, expect } from 'vitest';
import { gitBasicsChallenges } from '../seed-git-basics';
import type { NewChallenge } from '../schema';

describe('Git Basics seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 30 challenges', () => {
      expect(gitBasicsChallenges.length).toBe(30);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType bash for all challenges', () => {
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have bash syntaxType`
        ).toBe('bash');
      });
    });

    it('should have hints for all challenges', () => {
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('git command coverage', () => {
    const getCommandsByPrefix = (prefix: string) =>
      gitBasicsChallenges.filter((c) => c.content.startsWith(prefix));

    it('should have git status challenges', () => {
      const statusChallenges = getCommandsByPrefix('git status');
      expect(statusChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have git add challenges', () => {
      const addChallenges = getCommandsByPrefix('git add');
      expect(addChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have git commit challenges', () => {
      const commitChallenges = getCommandsByPrefix('git commit');
      expect(commitChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have git push challenges', () => {
      const pushChallenges = getCommandsByPrefix('git push');
      expect(pushChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have git pull challenges', () => {
      const pullChallenges = getCommandsByPrefix('git pull');
      expect(pullChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have git branch challenges', () => {
      const branchChallenges = getCommandsByPrefix('git branch');
      expect(branchChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have git checkout challenges', () => {
      const checkoutChallenges = getCommandsByPrefix('git checkout');
      expect(checkoutChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have git merge challenges', () => {
      const mergeChallenges = getCommandsByPrefix('git merge');
      expect(mergeChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = gitBasicsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = gitBasicsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have more beginner challenges than intermediate', () => {
      const beginnerCount = gitBasicsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = gitBasicsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      expect(beginnerCount).toBeGreaterThanOrEqual(intermediateCount);
    });
  });

  describe('content validity', () => {
    it('should have all challenges start with git', () => {
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.startsWith('git'),
          `Challenge ${index + 1} should start with "git": ${challenge.content}`
        ).toBe(true);
      });
    });

    it('should have no duplicate content', () => {
      const contents = gitBasicsChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      gitBasicsChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(6); // minimum "git" + space + command
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      gitBasicsChallenges.forEach((challenge) => {
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
