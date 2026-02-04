import { describe, it, expect } from 'vitest';
import { reactChallenges } from '../seed-react';
import type { NewChallenge } from '../schema';

describe('React Patterns seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 25 challenges', () => {
      expect(reactChallenges.length).toBe(25);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      reactChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      reactChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType typescript for all challenges', () => {
      reactChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have typescript syntaxType`
        ).toBe('typescript');
      });
    });

    it('should have hints for all challenges', () => {
      reactChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('React hooks coverage', () => {
    const getHookChallenges = (hookName: string) =>
      reactChallenges.filter((c) => c.content.includes(hookName));

    it('should have useState challenges', () => {
      const useStateChallenges = getHookChallenges('useState');
      expect(useStateChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have useEffect challenges', () => {
      const useEffectChallenges = getHookChallenges('useEffect');
      expect(useEffectChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have useCallback challenges', () => {
      const useCallbackChallenges = getHookChallenges('useCallback');
      expect(useCallbackChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have useMemo challenges', () => {
      const useMemoChallenges = getHookChallenges('useMemo');
      expect(useMemoChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have useRef challenges', () => {
      const useRefChallenges = getHookChallenges('useRef');
      expect(useRefChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have useReducer challenges', () => {
      const useReducerChallenges = getHookChallenges('useReducer');
      expect(useReducerChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have useContext challenges', () => {
      const useContextChallenges = getHookChallenges('useContext');
      expect(useContextChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('component patterns coverage', () => {
    it('should have forwardRef challenge', () => {
      const forwardRefChallenges = reactChallenges.filter((c) =>
        c.content.includes('forwardRef')
      );
      expect(forwardRefChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have memo challenge', () => {
      const memoChallenges = reactChallenges.filter((c) =>
        c.content.includes('memo(')
      );
      expect(memoChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have component with props challenge', () => {
      const propsPatternChallenges = reactChallenges.filter((c) =>
        c.content.includes('Props')
      );
      expect(propsPatternChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = reactChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = reactChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = reactChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have balanced difficulty distribution', () => {
      const beginnerCount = reactChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = reactChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = reactChallenges.filter(
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
      const contents = reactChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      reactChallenges.forEach((challenge, index) => {
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

    it('should contain valid React/TypeScript syntax patterns', () => {
      const validPatterns = [
        'useState',
        'useEffect',
        'useCallback',
        'useMemo',
        'useRef',
        'useReducer',
        'useContext',
        'forwardRef',
        'memo',
        'function',
        'const',
      ];

      reactChallenges.forEach((challenge, index) => {
        const hasValidPattern = validPatterns.some((pattern) =>
          challenge.content.includes(pattern)
        );
        expect(
          hasValidPattern,
          `Challenge ${index + 1} should contain valid React pattern: ${challenge.content}`
        ).toBe(true);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      reactChallenges.forEach((challenge) => {
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
