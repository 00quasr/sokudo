import { describe, it, expect } from 'vitest';
import { categories, type Category, type NewCategory } from '../schema';

describe('categories schema', () => {
  describe('table structure', () => {
    it('should have the correct table name', () => {
      // Drizzle tables expose their SQL name via the symbol accessor
      const tableName = (categories as Record<symbol, { name: string }>)[
        Object.getOwnPropertySymbols(categories).find(
          (s) => s.description === 'drizzle:Name'
        ) as symbol
      ];
      expect(tableName).toBe('categories');
    });

    it('should have all required columns', () => {
      const columnNames = Object.keys(categories);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('icon');
      expect(columnNames).toContain('difficulty');
      expect(columnNames).toContain('isPremium');
      expect(columnNames).toContain('displayOrder');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });

    it('should have id as primary key', () => {
      expect(categories.id.primary).toBe(true);
    });

    it('should have slug as unique', () => {
      expect(categories.slug.isUnique).toBe(true);
    });
  });

  describe('column defaults', () => {
    it('should default difficulty to beginner', () => {
      expect(categories.difficulty.default).toBe('beginner');
    });

    it('should default isPremium to false', () => {
      expect(categories.isPremium.default).toBe(false);
    });

    it('should default displayOrder to 0', () => {
      expect(categories.displayOrder.default).toBe(0);
    });
  });

  describe('type inference', () => {
    it('should allow valid NewCategory object', () => {
      const newCategory: NewCategory = {
        name: 'Git Basics',
        slug: 'git-basics',
        description: 'Essential git commands',
        icon: 'git-branch',
        difficulty: 'beginner',
        isPremium: false,
        displayOrder: 1,
      };

      expect(newCategory.name).toBe('Git Basics');
      expect(newCategory.slug).toBe('git-basics');
      expect(newCategory.description).toBe('Essential git commands');
      expect(newCategory.icon).toBe('git-branch');
      expect(newCategory.difficulty).toBe('beginner');
      expect(newCategory.isPremium).toBe(false);
      expect(newCategory.displayOrder).toBe(1);
    });

    it('should allow NewCategory with only required fields', () => {
      const minimalCategory: NewCategory = {
        name: 'Docker',
        slug: 'docker',
      };

      expect(minimalCategory.name).toBe('Docker');
      expect(minimalCategory.slug).toBe('docker');
      expect(minimalCategory.description).toBeUndefined();
      expect(minimalCategory.icon).toBeUndefined();
    });

    it('should infer Category type with all fields', () => {
      const category: Category = {
        id: 1,
        name: 'React Patterns',
        slug: 'react-patterns',
        description: 'Common React patterns',
        icon: 'code',
        difficulty: 'intermediate',
        isPremium: true,
        displayOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(category.id).toBe(1);
      expect(typeof category.createdAt).toBe('object');
      expect(category.createdAt instanceof Date).toBe(true);
    });
  });

  describe('difficulty values', () => {
    it('should accept beginner difficulty', () => {
      const category: NewCategory = {
        name: 'Test',
        slug: 'test',
        difficulty: 'beginner',
      };
      expect(category.difficulty).toBe('beginner');
    });

    it('should accept intermediate difficulty', () => {
      const category: NewCategory = {
        name: 'Test',
        slug: 'test',
        difficulty: 'intermediate',
      };
      expect(category.difficulty).toBe('intermediate');
    });

    it('should accept advanced difficulty', () => {
      const category: NewCategory = {
        name: 'Test',
        slug: 'test',
        difficulty: 'advanced',
      };
      expect(category.difficulty).toBe('advanced');
    });
  });

  describe('premium flag', () => {
    it('should allow free categories', () => {
      const freeCategory: NewCategory = {
        name: 'Git Basics',
        slug: 'git-basics',
        isPremium: false,
      };
      expect(freeCategory.isPremium).toBe(false);
    });

    it('should allow premium categories', () => {
      const premiumCategory: NewCategory = {
        name: 'Advanced TypeScript',
        slug: 'advanced-typescript',
        isPremium: true,
      };
      expect(premiumCategory.isPremium).toBe(true);
    });
  });

  describe('display order', () => {
    it('should accept positive display order', () => {
      const category: NewCategory = {
        name: 'Test',
        slug: 'test',
        displayOrder: 5,
      };
      expect(category.displayOrder).toBe(5);
    });

    it('should accept zero display order', () => {
      const category: NewCategory = {
        name: 'Test',
        slug: 'test',
        displayOrder: 0,
      };
      expect(category.displayOrder).toBe(0);
    });
  });
});

describe('seed data validation', () => {
  const seedCategories: NewCategory[] = [
    {
      name: 'Git Basics',
      slug: 'git-basics',
      description: 'Essential git commands for version control',
      icon: 'git-branch',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 1,
    },
    {
      name: 'Git Advanced',
      slug: 'git-advanced',
      description: 'Advanced git workflows and commands',
      icon: 'git-merge',
      difficulty: 'intermediate',
      isPremium: false,
      displayOrder: 2,
    },
    {
      name: 'Terminal Commands',
      slug: 'terminal-commands',
      description: 'Common terminal and shell commands',
      icon: 'terminal',
      difficulty: 'beginner',
      isPremium: false,
      displayOrder: 3,
    },
    {
      name: 'React Patterns',
      slug: 'react-patterns',
      description: 'Common React component patterns and hooks',
      icon: 'code',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 4,
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      description: 'TypeScript type annotations and patterns',
      icon: 'file-type',
      difficulty: 'intermediate',
      isPremium: true,
      displayOrder: 5,
    },
    {
      name: 'Docker',
      slug: 'docker',
      description: 'Docker commands and Dockerfile patterns',
      icon: 'container',
      difficulty: 'advanced',
      isPremium: true,
      displayOrder: 6,
    },
  ];

  it('should have 6 seed categories', () => {
    expect(seedCategories.length).toBe(6);
  });

  it('should have unique slugs', () => {
    const slugs = seedCategories.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should have unique display orders', () => {
    const orders = seedCategories.map((c) => c.displayOrder);
    const uniqueOrders = new Set(orders);
    expect(orders.length).toBe(uniqueOrders.size);
  });

  it('should have 3 free categories', () => {
    const freeCategories = seedCategories.filter((c) => c.isPremium === false);
    expect(freeCategories.length).toBe(3);
  });

  it('should have 3 premium categories', () => {
    const premiumCategories = seedCategories.filter((c) => c.isPremium === true);
    expect(premiumCategories.length).toBe(3);
  });

  it('should have at least one category for each difficulty level', () => {
    const difficulties = seedCategories.map((c) => c.difficulty);
    expect(difficulties).toContain('beginner');
    expect(difficulties).toContain('intermediate');
    expect(difficulties).toContain('advanced');
  });

  it('should have display orders in ascending sequence starting from 1', () => {
    const sortedOrders = seedCategories
      .map((c) => c.displayOrder as number)
      .sort((a, b) => a - b);
    expect(sortedOrders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should have descriptions for all categories', () => {
    seedCategories.forEach((category) => {
      expect(category.description).toBeTruthy();
      expect(category.description!.length).toBeGreaterThan(10);
    });
  });

  it('should have icons for all categories', () => {
    seedCategories.forEach((category) => {
      expect(category.icon).toBeTruthy();
    });
  });
});
