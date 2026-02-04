import { describe, it, expect } from 'vitest';
import { gitAdvancedChallenges } from '../seed-git-advanced';
import type { NewChallenge } from '../schema';

describe('Git Advanced seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 25 challenges', () => {
      expect(gitAdvancedChallenges.length).toBe(25);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      gitAdvancedChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      gitAdvancedChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType bash for all challenges', () => {
      gitAdvancedChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have bash syntaxType`
        ).toBe('bash');
      });
    });

    it('should have hints for all challenges', () => {
      gitAdvancedChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('git command coverage', () => {
    const getCommandsByPrefix = (prefix: string) =>
      gitAdvancedChallenges.filter((c) => c.content.startsWith(prefix));

    it('should have git rebase challenges', () => {
      const rebaseChallenges = getCommandsByPrefix('git rebase');
      expect(rebaseChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have git stash challenges', () => {
      const stashChallenges = getCommandsByPrefix('git stash');
      expect(stashChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have git cherry-pick challenges', () => {
      const cherryPickChallenges = getCommandsByPrefix('git cherry-pick');
      expect(cherryPickChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have git reflog challenges', () => {
      const reflogChallenges = getCommandsByPrefix('git reflog');
      expect(reflogChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have git bisect challenges', () => {
      const bisectChallenges = getCommandsByPrefix('git bisect');
      expect(bisectChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have reflog-related reset/checkout challenges', () => {
      const reflogRelated = gitAdvancedChallenges.filter(
        (c) => c.content.includes('HEAD@{')
      );
      expect(reflogRelated.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('difficulty distribution', () => {
    it('should have intermediate challenges', () => {
      const intermediateChallenges = gitAdvancedChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = gitAdvancedChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have no beginner challenges (this is advanced category)', () => {
      const beginnerChallenges = gitAdvancedChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBe(0);
    });

    it('should have more intermediate than advanced challenges', () => {
      const intermediateCount = gitAdvancedChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = gitAdvancedChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;
      expect(intermediateCount).toBeGreaterThan(advancedCount);
    });
  });

  describe('content validity', () => {
    it('should have all challenges start with git', () => {
      gitAdvancedChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.startsWith('git'),
          `Challenge ${index + 1} should start with "git": ${challenge.content}`
        ).toBe(true);
      });
    });

    it('should have no duplicate content', () => {
      const contents = gitAdvancedChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      gitAdvancedChallenges.forEach((challenge, index) => {
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
      gitAdvancedChallenges.forEach((challenge) => {
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
