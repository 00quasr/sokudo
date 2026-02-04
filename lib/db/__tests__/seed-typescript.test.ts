import { describe, it, expect } from 'vitest';
import { typescriptChallenges } from '../seed-typescript';
import type { NewChallenge } from '../schema';

describe('TypeScript seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 25 challenges', () => {
      expect(typescriptChallenges.length).toBe(25);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      typescriptChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      typescriptChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType typescript for all challenges', () => {
      typescriptChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have typescript syntaxType`
        ).toBe('typescript');
      });
    });

    it('should have hints for all challenges', () => {
      typescriptChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('TypeScript concepts coverage', () => {
    const getChallengesByPattern = (pattern: string | RegExp) =>
      typescriptChallenges.filter((c) =>
        typeof pattern === 'string' ? c.content.includes(pattern) : pattern.test(c.content)
      );

    it('should have interface challenges', () => {
      const interfaceChallenges = getChallengesByPattern('interface');
      expect(interfaceChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have generic challenges', () => {
      const genericChallenges = getChallengesByPattern(/<[A-Z]/);
      expect(genericChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have type guard challenges', () => {
      const typeGuardChallenges = typescriptChallenges.filter(
        (c) => c.content.includes('is ') || c.content.includes('asserts')
      );
      expect(typeGuardChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have utility type challenges', () => {
      const utilityTypes = [
        'Partial',
        'Required',
        'Readonly',
        'Pick',
        'Omit',
        'Record',
        'ReturnType',
        'NonNullable',
      ];
      const utilityTypeChallenges = typescriptChallenges.filter((c) =>
        utilityTypes.some((ut) => c.content.includes(ut))
      );
      expect(utilityTypeChallenges.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = typescriptChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = typescriptChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = typescriptChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have balanced difficulty distribution', () => {
      const beginnerCount = typescriptChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = typescriptChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = typescriptChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;

      // At least 5 of each main difficulty level
      expect(beginnerCount).toBeGreaterThanOrEqual(5);
      expect(intermediateCount).toBeGreaterThanOrEqual(5);
      expect(advancedCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('content validity', () => {
    it('should have no duplicate content', () => {
      const contents = typescriptChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      typescriptChallenges.forEach((challenge, index) => {
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too short: ${challenge.content}`
        ).toBeGreaterThanOrEqual(15);
        expect(
          challenge.content.length,
          `Challenge ${index + 1} too long for typing practice: ${challenge.content}`
        ).toBeLessThanOrEqual(150);
      });
    });

    it('should contain valid TypeScript syntax patterns', () => {
      const validPatterns = [
        'interface',
        'type',
        'function',
        'class',
        'extends',
        'keyof',
        'typeof',
        'Partial',
        'Required',
        'Readonly',
        'Pick',
        'Omit',
        'Record',
        'ReturnType',
        'NonNullable',
        'if',
      ];

      typescriptChallenges.forEach((challenge, index) => {
        const hasValidPattern = validPatterns.some((pattern) =>
          challenge.content.includes(pattern)
        );
        expect(
          hasValidPattern,
          `Challenge ${index + 1} should contain valid TypeScript pattern: ${challenge.content}`
        ).toBe(true);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      typescriptChallenges.forEach((challenge) => {
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
