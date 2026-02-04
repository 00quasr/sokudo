import { describe, it, expect } from 'vitest';
import { dockerChallenges } from '../seed-docker';
import type { NewChallenge } from '../schema';

describe('Docker seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 25 challenges', () => {
      expect(dockerChallenges.length).toBe(25);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      dockerChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      dockerChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType bash for all challenges', () => {
      dockerChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have bash syntaxType`
        ).toBe('bash');
      });
    });

    it('should have hints for all challenges', () => {
      dockerChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('docker command coverage', () => {
    const getCommandsByKeyword = (keyword: string) =>
      dockerChallenges.filter((c) => c.content.includes(keyword));

    it('should have docker run challenges', () => {
      const runChallenges = getCommandsByKeyword('docker run');
      expect(runChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have docker build challenges', () => {
      const buildChallenges = getCommandsByKeyword('docker build');
      expect(buildChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have docker compose challenges', () => {
      const composeChallenges = getCommandsByKeyword('docker compose');
      expect(composeChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have docker exec challenges', () => {
      const execChallenges = getCommandsByKeyword('docker exec');
      expect(execChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have docker logs challenges', () => {
      const logsChallenges = getCommandsByKeyword('docker logs');
      expect(logsChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have docker prune challenges', () => {
      const pruneChallenges = getCommandsByKeyword('prune');
      expect(pruneChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have docker network challenges', () => {
      const networkChallenges = getCommandsByKeyword('docker network');
      expect(networkChallenges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = dockerChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = dockerChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = dockerChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });
  });

  describe('content validity', () => {
    it('should have all challenges start with docker', () => {
      dockerChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.startsWith('docker'),
          `Challenge ${index + 1} should start with "docker": ${challenge.content}`
        ).toBe(true);
      });
    });

    it('should have no duplicate content', () => {
      const contents = dockerChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      dockerChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(10); // minimum "docker run" + args
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      dockerChallenges.forEach((challenge) => {
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
