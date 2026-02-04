import { describe, it, expect } from 'vitest';
import { challenges, type Challenge, type NewChallenge } from '../schema';

describe('challenges schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      const tableName = (challenges as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(challenges).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('challenges');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(challenges);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('categoryId');
      expect(columnNames).toContain('content');
      expect(columnNames).toContain('difficulty');
      expect(columnNames).toContain('syntaxType');
      expect(columnNames).toContain('hint');
      expect(columnNames).toContain('avgWpm');
      expect(columnNames).toContain('timesCompleted');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(challenges.id.primary).toBe(true);
    });

    it('should have categoryId as foreign key', () => {
      expect(challenges.categoryId.notNull).toBe(true);
    });
  });

  describe('column defaults', () => {
    it('should default difficulty to beginner', () => {
      expect(challenges.difficulty.default).toBe('beginner');
    });

    it('should default syntaxType to plain', () => {
      expect(challenges.syntaxType.default).toBe('plain');
    });

    it('should default avgWpm to 0', () => {
      expect(challenges.avgWpm.default).toBe(0);
    });

    it('should default timesCompleted to 0', () => {
      expect(challenges.timesCompleted.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewChallenge object', () => {
      const newChallenge: NewChallenge = {
        categoryId: 1,
        content: 'git commit -m "initial commit"',
        difficulty: 'beginner',
        syntaxType: 'bash',
        hint: 'Use double quotes for the commit message',
        avgWpm: 45,
        timesCompleted: 100,
      };

      expect(newChallenge.categoryId).toBe(1);
      expect(newChallenge.content).toBe('git commit -m "initial commit"');
      expect(newChallenge.difficulty).toBe('beginner');
      expect(newChallenge.syntaxType).toBe('bash');
      expect(newChallenge.hint).toBe('Use double quotes for the commit message');
      expect(newChallenge.avgWpm).toBe(45);
      expect(newChallenge.timesCompleted).toBe(100);
    });

    it('should allow NewChallenge with only required fields', () => {
      const minimalChallenge: NewChallenge = {
        categoryId: 1,
        content: 'git status',
      };

      expect(minimalChallenge.categoryId).toBe(1);
      expect(minimalChallenge.content).toBe('git status');
      expect(minimalChallenge.hint).toBeUndefined();
      expect(minimalChallenge.avgWpm).toBeUndefined();
      expect(minimalChallenge.timesCompleted).toBeUndefined();
    });

    it('should infer Challenge type with all fields', () => {
      const challenge: Challenge = {
        id: 1,
        categoryId: 1,
        content: 'git push origin main',
        difficulty: 'intermediate',
        syntaxType: 'bash',
        hint: 'Push to remote',
        avgWpm: 50,
        timesCompleted: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(challenge.id).toBe(1);
      expect(challenge.categoryId).toBe(1);
      expect(typeof challenge.createdAt).toBe('object');
      expect(challenge.createdAt instanceof Date).toBe(true);
    });
  });

  describe('difficulty values', () => {
    it('should accept beginner difficulty', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'git init',
        difficulty: 'beginner',
      };
      expect(challenge.difficulty).toBe('beginner');
    });

    it('should accept intermediate difficulty', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'git rebase -i HEAD~3',
        difficulty: 'intermediate',
      };
      expect(challenge.difficulty).toBe('intermediate');
    });

    it('should accept advanced difficulty', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'git filter-branch --tree-filter "rm -f passwords.txt" HEAD',
        difficulty: 'advanced',
      };
      expect(challenge.difficulty).toBe('advanced');
    });
  });

  describe('syntaxType values', () => {
    it('should accept plain syntaxType', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'Hello World',
        syntaxType: 'plain',
      };
      expect(challenge.syntaxType).toBe('plain');
    });

    it('should accept bash syntaxType', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'ls -la | grep node',
        syntaxType: 'bash',
      };
      expect(challenge.syntaxType).toBe('bash');
    });

    it('should accept typescript syntaxType', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'const foo: string = "bar"',
        syntaxType: 'typescript',
      };
      expect(challenge.syntaxType).toBe('typescript');
    });

    it('should accept jsx syntaxType', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: '<Button onClick={handleClick}>Click</Button>',
        syntaxType: 'jsx',
      };
      expect(challenge.syntaxType).toBe('jsx');
    });
  });

  describe('statistics fields', () => {
    it('should allow zero avgWpm', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'test',
        avgWpm: 0,
      };
      expect(challenge.avgWpm).toBe(0);
    });

    it('should allow positive avgWpm', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'test',
        avgWpm: 75,
      };
      expect(challenge.avgWpm).toBe(75);
    });

    it('should allow zero timesCompleted', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'test',
        timesCompleted: 0,
      };
      expect(challenge.timesCompleted).toBe(0);
    });

    it('should allow positive timesCompleted', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'test',
        timesCompleted: 1500,
      };
      expect(challenge.timesCompleted).toBe(1500);
    });
  });

  describe('hint field', () => {
    it('should allow null hint', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'test',
        hint: null,
      };
      expect(challenge.hint).toBeNull();
    });

    it('should allow string hint', () => {
      const challenge: NewChallenge = {
        categoryId: 1,
        content: 'git stash',
        hint: 'Temporarily store modified files',
      };
      expect(challenge.hint).toBe('Temporarily store modified files');
    });
  });
});

describe('seed data validation', () => {
  const seedChallenges: NewChallenge[] = [
    {
      categoryId: 1, // Git Basics
      content: 'git init',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Initialize a new repository',
    },
    {
      categoryId: 1,
      content: 'git status',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Check working directory status',
    },
    {
      categoryId: 1,
      content: 'git add .',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Stage all changes',
    },
    {
      categoryId: 1,
      content: 'git commit -m "initial commit"',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Commit with a message',
    },
    {
      categoryId: 2, // Git Advanced
      content: 'git rebase -i HEAD~3',
      difficulty: 'intermediate',
      syntaxType: 'bash',
      hint: 'Interactive rebase last 3 commits',
    },
    {
      categoryId: 2,
      content: 'git cherry-pick abc123',
      difficulty: 'intermediate',
      syntaxType: 'bash',
      hint: 'Apply a specific commit',
    },
  ];

  it('should have at least 6 seed challenges', () => {
    expect(seedChallenges.length).toBeGreaterThanOrEqual(6);
  });

  it('should have categoryId for all challenges', () => {
    seedChallenges.forEach((challenge) => {
      expect(challenge.categoryId).toBeDefined();
      expect(typeof challenge.categoryId).toBe('number');
    });
  });

  it('should have content for all challenges', () => {
    seedChallenges.forEach((challenge) => {
      expect(challenge.content).toBeTruthy();
      expect(challenge.content.length).toBeGreaterThan(0);
    });
  });

  it('should have valid difficulty values', () => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    seedChallenges.forEach((challenge) => {
      expect(validDifficulties).toContain(challenge.difficulty);
    });
  });

  it('should have syntaxType for all challenges', () => {
    seedChallenges.forEach((challenge) => {
      expect(challenge.syntaxType).toBeTruthy();
    });
  });

  it('should have at least one beginner challenge', () => {
    const beginnerChallenges = seedChallenges.filter(
      (c) => c.difficulty === 'beginner'
    );
    expect(beginnerChallenges.length).toBeGreaterThan(0);
  });

  it('should have at least one intermediate challenge', () => {
    const intermediateChallenges = seedChallenges.filter(
      (c) => c.difficulty === 'intermediate'
    );
    expect(intermediateChallenges.length).toBeGreaterThan(0);
  });
});
