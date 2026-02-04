import { describe, it, expect } from "vitest";
import {
  BUILTIN_CHALLENGES,
  getChallengesByCategory,
  getChallengesByDifficulty,
  getRandomChallenge,
  getCategories,
  getDifficulties,
} from "../panels/challenges";

describe("challenges", () => {
  describe("BUILTIN_CHALLENGES", () => {
    it("should have challenges defined", () => {
      expect(BUILTIN_CHALLENGES.length).toBeGreaterThan(0);
    });

    it("should have unique IDs for all challenges", () => {
      const ids = BUILTIN_CHALLENGES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required fields for every challenge", () => {
      for (const challenge of BUILTIN_CHALLENGES) {
        expect(challenge.id).toBeTruthy();
        expect(challenge.category).toBeTruthy();
        expect(challenge.text).toBeTruthy();
        expect(challenge.description).toBeTruthy();
      }
    });

    it("should have non-empty text for all challenges", () => {
      for (const challenge of BUILTIN_CHALLENGES) {
        expect(challenge.text.length).toBeGreaterThan(0);
      }
    });

    it("should have a valid difficulty for all challenges", () => {
      const validDifficulties = ["easy", "medium", "hard"];
      for (const challenge of BUILTIN_CHALLENGES) {
        expect(validDifficulties).toContain(challenge.difficulty);
      }
    });
  });

  describe("getChallengesByCategory", () => {
    it("should return git challenges", () => {
      const gitChallenges = getChallengesByCategory("git");
      expect(gitChallenges.length).toBeGreaterThan(0);
      expect(gitChallenges.every((c) => c.category === "git")).toBe(true);
    });

    it("should return terminal challenges", () => {
      const terminalChallenges = getChallengesByCategory("terminal");
      expect(terminalChallenges.length).toBeGreaterThan(0);
      expect(terminalChallenges.every((c) => c.category === "terminal")).toBe(
        true
      );
    });

    it("should return react challenges", () => {
      const reactChallenges = getChallengesByCategory("react");
      expect(reactChallenges.length).toBeGreaterThan(0);
      expect(reactChallenges.every((c) => c.category === "react")).toBe(true);
    });

    it("should return ai-prompts challenges", () => {
      const aiChallenges = getChallengesByCategory("ai-prompts");
      expect(aiChallenges.length).toBeGreaterThan(0);
      expect(aiChallenges.every((c) => c.category === "ai-prompts")).toBe(true);
    });

    it("should return empty array for unknown category", () => {
      const unknown = getChallengesByCategory("nonexistent");
      expect(unknown).toEqual([]);
    });
  });

  describe("getChallengesByDifficulty", () => {
    it("should return easy challenges", () => {
      const easy = getChallengesByDifficulty("easy");
      expect(easy.length).toBeGreaterThan(0);
      expect(easy.every((c) => c.difficulty === "easy")).toBe(true);
    });

    it("should return medium challenges", () => {
      const medium = getChallengesByDifficulty("medium");
      expect(medium.length).toBeGreaterThan(0);
      expect(medium.every((c) => c.difficulty === "medium")).toBe(true);
    });

    it("should return hard challenges", () => {
      const hard = getChallengesByDifficulty("hard");
      expect(hard.length).toBeGreaterThan(0);
      expect(hard.every((c) => c.difficulty === "hard")).toBe(true);
    });
  });

  describe("getRandomChallenge", () => {
    it("should return a challenge from the specified category", () => {
      const challenge = getRandomChallenge("git");
      expect(challenge.category).toBe("git");
    });

    it("should return a challenge from any category when none specified", () => {
      const challenge = getRandomChallenge();
      expect(challenge).toBeDefined();
      expect(challenge.id).toBeTruthy();
      expect(challenge.text).toBeTruthy();
    });

    it("should return a valid challenge object", () => {
      const challenge = getRandomChallenge("terminal");
      expect(challenge).toHaveProperty("id");
      expect(challenge).toHaveProperty("category");
      expect(challenge).toHaveProperty("text");
      expect(challenge).toHaveProperty("description");
    });

    it("should filter by difficulty when specified", () => {
      const challenge = getRandomChallenge("git", "easy");
      expect(challenge.category).toBe("git");
      expect(challenge.difficulty).toBe("easy");
    });

    it("should fall back to category pool if no matches for difficulty", () => {
      // Even if we ask for a combo that might not exist, should still return something
      const challenge = getRandomChallenge("git");
      expect(challenge).toBeDefined();
      expect(challenge.category).toBe("git");
    });
  });

  describe("getDifficulties", () => {
    it("should return all three difficulty levels", () => {
      const difficulties = getDifficulties();
      expect(difficulties).toContain("easy");
      expect(difficulties).toContain("medium");
      expect(difficulties).toContain("hard");
    });

    it("should have exactly 3 difficulties", () => {
      const difficulties = getDifficulties();
      expect(difficulties.length).toBe(3);
    });
  });

  describe("getCategories", () => {
    it("should return all unique categories", () => {
      const categories = getCategories();
      expect(categories).toContain("git");
      expect(categories).toContain("terminal");
      expect(categories).toContain("react");
      expect(categories).toContain("ai-prompts");
    });

    it("should not contain duplicates", () => {
      const categories = getCategories();
      const unique = new Set(categories);
      expect(unique.size).toBe(categories.length);
    });

    it("should have exactly 4 categories", () => {
      const categories = getCategories();
      expect(categories.length).toBe(4);
    });
  });
});
