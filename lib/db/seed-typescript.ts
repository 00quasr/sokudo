import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * TypeScript challenges covering core TypeScript patterns:
 * interfaces, generics, type guards, utility types
 *
 * 25 challenges total, varying in difficulty:
 * - beginner: simple type annotations and interfaces
 * - intermediate: generics, union types, type narrowing
 * - advanced: complex utility types and type guards
 */
export const typescriptChallenges = [
  // === Interfaces (6 challenges) ===
  {
    content: 'interface User { id: number; name: string; }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Define a basic interface with properties',
  },
  {
    content: 'interface Props { children: React.ReactNode; }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Interface for React component props',
  },
  {
    content: 'interface Config { readonly apiUrl: string; timeout?: number; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Interface with readonly and optional properties',
  },
  {
    content: 'interface Repository<T> { findById(id: string): Promise<T>; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic interface with method signature',
  },
  {
    content: 'interface Animal { speak(): void; } interface Dog extends Animal { breed: string; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Interface inheritance',
  },
  {
    content: 'interface EventMap { click: MouseEvent; keydown: KeyboardEvent; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Interface as a type map',
  },

  // === Generics (6 challenges) ===
  {
    content: 'function identity<T>(arg: T): T { return arg; }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Basic generic function',
  },
  {
    content: 'type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic discriminated union type',
  },
  {
    content: 'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic with keyof constraint',
  },
  {
    content: 'class Stack<T> { private items: T[] = []; push(item: T): void { this.items.push(item); } }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic class with method',
  },
  {
    content: 'type Nullable<T> = T | null | undefined',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic type alias for nullable values',
  },
  {
    content: 'function merge<T extends object, U extends object>(a: T, b: U): T & U { return { ...a, ...b }; }',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic function with object constraints',
  },

  // === Type Guards (5 challenges) ===
  {
    content: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Type guard using typeof',
  },
  {
    content: 'function isUser(obj: unknown): obj is User { return obj !== null && typeof obj === "object" && "id" in obj; }',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Type guard for object type',
  },
  {
    content: 'function assertNonNull<T>(value: T | null): asserts value is T { if (value === null) throw new Error(); }',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Assertion function',
  },
  {
    content: 'if ("error" in response) { console.log(response.error); }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Narrowing with in operator',
  },
  {
    content: 'function isArray<T>(value: T | T[]): value is T[] { return Array.isArray(value); }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generic type guard for arrays',
  },

  // === Utility Types (8 challenges) ===
  {
    content: 'type UserPartial = Partial<User>',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Make all properties optional',
  },
  {
    content: 'type UserRequired = Required<UserPartial>',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Make all properties required',
  },
  {
    content: 'type UserReadonly = Readonly<User>',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Make all properties readonly',
  },
  {
    content: 'type UserName = Pick<User, "id" | "name">',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Pick specific properties from a type',
  },
  {
    content: 'type UserWithoutEmail = Omit<User, "email">',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Omit properties from a type',
  },
  {
    content: 'type StringRecord = Record<string, number>',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Create a record type',
  },
  {
    content: 'type ReturnTypeOfFn = ReturnType<typeof fetchUser>',
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Extract return type of a function',
  },
  {
    content: 'type NonNullName = NonNullable<string | null | undefined>',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Remove null and undefined from type',
  },
];

export async function seedTypescriptChallenges() {
  console.log('Seeding TypeScript challenges...');

  // Get the TypeScript category
  const [typescriptCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'typescript'))
    .limit(1);

  if (!typescriptCategory) {
    console.error('Error: TypeScript category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = typescriptCategory.id;

  // Insert challenges
  const challengeData = typescriptChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${typescriptChallenges.length} TypeScript challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedTypescriptChallenges()
    .catch((error) => {
      console.error('Seed TypeScript failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed TypeScript finished. Exiting...');
      process.exit(0);
    });
}
