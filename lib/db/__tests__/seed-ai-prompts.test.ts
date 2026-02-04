import { describe, it, expect } from 'vitest';
import { aiPromptsChallenges } from '../seed-ai-prompts';
import type { NewChallenge } from '../schema';

describe('AI Prompts seed data', () => {
  describe('challenge count', () => {
    it('should have exactly 30 challenges', () => {
      expect(aiPromptsChallenges.length).toBe(30);
    });
  });

  describe('challenge structure', () => {
    it('should have content for all challenges', () => {
      aiPromptsChallenges.forEach((challenge, index) => {
        expect(challenge.content, `Challenge ${index + 1} missing content`).toBeTruthy();
        expect(challenge.content.length, `Challenge ${index + 1} has empty content`).toBeGreaterThan(0);
      });
    });

    it('should have valid difficulty for all challenges', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      aiPromptsChallenges.forEach((challenge, index) => {
        expect(
          validDifficulties,
          `Challenge ${index + 1} has invalid difficulty: ${challenge.difficulty}`
        ).toContain(challenge.difficulty);
      });
    });

    it('should have valid syntaxType for all challenges', () => {
      const validSyntaxTypes = ['prompt', 'code-comment', 'typescript'];
      aiPromptsChallenges.forEach((challenge, index) => {
        expect(
          validSyntaxTypes,
          `Challenge ${index + 1} has invalid syntaxType: ${challenge.syntaxType}`
        ).toContain(challenge.syntaxType);
      });
    });

    it('should have hints for all challenges', () => {
      aiPromptsChallenges.forEach((challenge, index) => {
        expect(challenge.hint, `Challenge ${index + 1} missing hint`).toBeTruthy();
        expect(challenge.hint!.length, `Challenge ${index + 1} has empty hint`).toBeGreaterThan(0);
      });
    });
  });

  describe('AI tool coverage', () => {
    const getChallengesByHint = (pattern: string) =>
      aiPromptsChallenges.filter((c) =>
        c.hint?.toLowerCase().includes(pattern.toLowerCase())
      );

    it('should have Claude-related challenges (XML tags, structured prompts)', () => {
      // Claude challenges use XML tags and structured output patterns
      const claudeChallenges = aiPromptsChallenges.filter(
        (c) =>
          c.hint?.toLowerCase().includes('xml') ||
          c.hint?.toLowerCase().includes('claude') ||
          c.hint?.toLowerCase().includes('chain of thought') ||
          c.hint?.toLowerCase().includes('uncertainty') ||
          c.hint?.toLowerCase().includes('few-shot')
      );
      expect(claudeChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have ChatGPT-related challenges (roles, explanations)', () => {
      const chatGptChallenges = aiPromptsChallenges.filter(
        (c) =>
          c.hint?.toLowerCase().includes('chatgpt') ||
          c.hint?.toLowerCase().includes('role assignment') ||
          c.hint?.toLowerCase().includes('audience') ||
          c.hint?.toLowerCase().includes('multi-part') ||
          c.hint?.toLowerCase().includes('comparison') ||
          c.hint?.toLowerCase().includes('decomposition') ||
          c.hint?.toLowerCase().includes('output format constraint')
      );
      expect(chatGptChallenges.length).toBeGreaterThanOrEqual(5);
    });

    it('should have Cursor-related challenges', () => {
      const cursorChallenges = getChallengesByHint('cursor');
      expect(cursorChallenges.length).toBeGreaterThanOrEqual(6);
    });

    it('should have Copilot-related challenges', () => {
      const copilotChallenges = getChallengesByHint('copilot');
      expect(copilotChallenges.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('prompt pattern coverage', () => {
    it('should have chain of thought prompts', () => {
      const cotChallenges = aiPromptsChallenges.filter(
        (c) => c.content.toLowerCase().includes('step by step') ||
               c.content.toLowerCase().includes('break down') ||
               c.content.toLowerCase().includes('reasoning')
      );
      expect(cotChallenges.length).toBeGreaterThanOrEqual(2);
    });

    it('should have role-based prompts', () => {
      const roleChallenges = aiPromptsChallenges.filter(
        (c) => c.content.toLowerCase().includes('act as') ||
               c.content.toLowerCase().includes('you are a') ||
               c.content.toLowerCase().includes('expert')
      );
      expect(roleChallenges.length).toBeGreaterThanOrEqual(3);
    });

    it('should have code comment style prompts', () => {
      const codeCommentChallenges = aiPromptsChallenges.filter(
        (c) => c.syntaxType === 'code-comment'
      );
      expect(codeCommentChallenges.length).toBeGreaterThanOrEqual(10);
    });

    it('should have structured output prompts', () => {
      const structuredChallenges = aiPromptsChallenges.filter(
        (c) => c.content.toLowerCase().includes('json') ||
               c.content.toLowerCase().includes('table') ||
               c.content.toLowerCase().includes('format')
      );
      expect(structuredChallenges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('difficulty distribution', () => {
    it('should have beginner challenges', () => {
      const beginnerChallenges = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      );
      expect(beginnerChallenges.length).toBeGreaterThan(0);
    });

    it('should have intermediate challenges', () => {
      const intermediateChallenges = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      );
      expect(intermediateChallenges.length).toBeGreaterThan(0);
    });

    it('should have advanced challenges', () => {
      const advancedChallenges = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      );
      expect(advancedChallenges.length).toBeGreaterThan(0);
    });

    it('should have balanced difficulty distribution', () => {
      const beginnerCount = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'beginner'
      ).length;
      const intermediateCount = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'intermediate'
      ).length;
      const advancedCount = aiPromptsChallenges.filter(
        (c) => c.difficulty === 'advanced'
      ).length;

      // At least 5 beginner, 10 intermediate, 3 advanced
      expect(beginnerCount).toBeGreaterThanOrEqual(5);
      expect(intermediateCount).toBeGreaterThanOrEqual(10);
      expect(advancedCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('content validity', () => {
    it('should have no duplicate content', () => {
      const contents = aiPromptsChallenges.map((c) => c.content);
      const uniqueContents = new Set(contents);
      expect(uniqueContents.size).toBe(contents.length);
    });

    it('should have reasonable content length (not too short or long)', () => {
      aiPromptsChallenges.forEach((challenge, index) => {
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
  });

  describe('type compatibility', () => {
    it('should be compatible with NewChallenge type when categoryId is added', () => {
      aiPromptsChallenges.forEach((challenge) => {
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
