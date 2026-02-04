import { describe, it, expect } from 'vitest';
import { packageManagersChallenges } from '../seed-package-managers';
import type { NewChallenge } from '../schema';

describe('Package Managers seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 20 challenges', () => {
      expect(packageManagersChallenges.length).toBe(20);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      packageManagersChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      packageManagersChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType bash for all challenges', () => {
      packageManagersChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have bash syntaxType`
        ).toBe('bash');
      });
    });

    it('should have hints for all challenges', () => {
      packageManagersChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('package manager coverage', () => {
    const getCommandsByKeyword = (keyword: string) =>
      packageManagersChallenges.filter((c) => c.content.includes(keyword));

    it('should have npm challenges', () => {
      const npmChallenges = getCommandsByKeyword('npm');
      expect(npmChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have yarn challenges', () => {
      const yarnChallenges = getCommandsByKeyword('yarn');
      expect(yarnChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have pnpm challenges', () => {
      const pnpmChallenges = getCommandsByKeyword('pnpm');
      expect(pnpmChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have npx challenges', () => {
      const npxChallenges = getCommandsByKeyword('npx');
      expect(npxChallenges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('command type coverage', () => {
    it('should have install commands', () => {
      const installChallenges = packageManagersChallenges.filter(
        (c) => c.content.includes('install') || c.content.includes('add')
      );
      expect(installChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have run commands', () => {
      const runChallenges = packageManagersChallenges.filter(
        (c) => c.content.includes('run') || c.content.includes('test')
      );
      expect(runChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have dlx/npx commands', () => {
      const dlxChallenges = packageManagersChallenges.filter(
        (c) => c.content.includes('dlx') || c.content.includes('npx')
      );
      expect(dlxChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have workspace commands', () => {
      const workspaceChallenges = packageManagersChallenges.filter(
        (c) =>
          c.content.includes('workspace') ||
          c.content.includes('--filter') ||
          c.content.includes('-w') ||
          c.content.includes('-r')
      );
      expect(workspaceChallenges.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = packageManagersChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = packageManagersChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = packageManagersChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have more beginner/intermediate challenges than advanced', () => {
      const beginnerCount = packageManagersChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = packageManagersChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = packageManagersChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;
      expect(beginnerCount + intermediateCount).toBeGreaterThan(advancedCount);
    });
  });

  describe('content validity', () => {
    it('should have all challenges start with npm, yarn, pnpm, or npx', () => {
      const validPrefixes = ['npm', 'yarn', 'pnpm', 'npx'];
      packageManagersChallenges.forEach((challenge, index) => {
        const startsWithValid = validPrefixes.some((prefix) =>
          challenge.content.startsWith(prefix)
        );
        expect(
          startsWithValid,
          `Challenge ${index + 1} should start with npm, yarn, pnpm, or npx: ${challenge.content}`
        ).toBe(true);
      });
    });

    it('should have no duplicate content', () => {
      const contents = packageManagersChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      packageManagersChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(8); // minimum "npm test"
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      packageManagersChallenges.forEach((challenge) => {
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
