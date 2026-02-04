import { describe, it, expect } from 'vitest';
import { nextjsChallenges } from '../seed-nextjs';
import type { NewChallenge } from '../schema';

describe('Next.js seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 20 challenges', () => {
      expect(nextjsChallenges.length).toBe(20);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      nextjsChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      nextjsChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have syntaxType typescript for all challenges', () => {
      nextjsChallenges.forEach((challenge, index) => {
        expect(
          challenge.syntaxType,
          `Challenge ${index + 1} should have typescript syntaxType`
        ).toBe('typescript');
      });
    });

    it('should have hints for all challenges', () => {
      nextjsChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('App Router coverage', () => {
    it('should have page component challenges', () => {
      const pageChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('function Page') || c.content.includes('default function Page')
      );
      expect(pageChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have layout component challenges', () => {
      const layoutChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('function Layout')
      );
      expect(layoutChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have loading component challenge', () => {
      const loadingChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('function Loading')
      );
      expect(loadingChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have error component challenge', () => {
      const errorChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('function Error')
      );
      expect(errorChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have not-found component challenge', () => {
      const notFoundChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('function NotFound') || c.content.includes('404')
      );
      expect(notFoundChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Server Actions coverage', () => {
    it('should have use server directive challenge', () => {
      const useServerChallenges = nextjsChallenges.filter((c) =>
        c.content.includes("'use server'")
      );
      expect(useServerChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have FormData handling challenge', () => {
      const formDataChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('FormData')
      );
      expect(formDataChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have revalidation challenges', () => {
      const revalidateChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('revalidatePath') || c.content.includes('revalidateTag')
      );
      expect(revalidateChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have useActionState challenge', () => {
      const actionStateChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('useActionState')
      );
      expect(actionStateChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Metadata API coverage', () => {
    it('should have metadata export challenges', () => {
      const metadataChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('metadata') && c.content.includes('Metadata')
      );
      expect(metadataChallenges.length).toBeGreaterThanOrEqual(4);
    });

    it('should have generateMetadata challenge', () => {
      const generateMetadataChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('generateMetadata')
      );
      expect(generateMetadataChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have openGraph metadata challenge', () => {
      const openGraphChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('openGraph')
      );
      expect(openGraphChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Routing coverage', () => {
    it('should have dynamic route params challenge', () => {
      const paramsChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('params') && c.content.includes('slug')
      );
      expect(paramsChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have generateStaticParams challenge', () => {
      const staticParamsChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('generateStaticParams')
      );
      expect(staticParamsChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have navigation imports challenge', () => {
      const navigationChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('next/navigation')
      );
      expect(navigationChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should have redirect challenge', () => {
      const redirectChallenges = nextjsChallenges.filter((c) =>
        c.content.includes('redirect')
      );
      expect(redirectChallenges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = nextjsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = nextjsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = nextjsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have balanced difficulty distribution', () => {
      const beginnerCount = nextjsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = nextjsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = nextjsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;

      // At least 5 beginner, 8 intermediate, 3 advanced
      expect(beginnerCount).toBeGreaterThanOrEqual(5);
      expect(intermediateCount).toBeGreaterThanOrEqual(8);
      expect(advancedCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('content validity', () => {
    it('should have no duplicate content', () => {
      const contents = nextjsChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      nextjsChallenges.forEach((challenge, index) => {
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

    it('should contain valid Next.js patterns', () => {
      const validPatterns = [
        'export',
        'function',
        'const',
        'import',
        'use server',
        'metadata',
        'revalidate',
        'params',
        'children',
      ];

      nextjsChallenges.forEach((challenge, index) => {
        const hasValidPattern = validPatterns.some((pattern) =>
          challenge.content.toLowerCase().includes(pattern.toLowerCase())
        );
        expect(
          hasValidPattern,
          `Challenge ${index + 1} should contain valid Next.js pattern: ${challenge.content}`
        ).toBe(true);
      });
    });
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      nextjsChallenges.forEach((challenge) => {
        const fullChallenge: NewChallenge = {
          ...challenge,
          categoryId: 1,
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
