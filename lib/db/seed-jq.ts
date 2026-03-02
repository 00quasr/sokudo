import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * jq challenges
 *
 * 25 challenges covering:
 * - Basic filters
 * - Object and array operations
 * - Transformations and conditionals
 */
export const jqChallenges = [
  // === Basic Filters ===
  {
    content: 'jq .',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Pretty print JSON',
  },
  {
    content: 'jq .name',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get a property',
  },
  {
    content: 'jq .user.name',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get nested property',
  },
  {
    content: 'jq .items[0]',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get first array element',
  },
  {
    content: 'jq .items[]',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Iterate over array',
  },
  {
    content: 'jq .items[].name',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Get property from each item',
  },

  // === Array Operations ===
  {
    content: 'jq length',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get array length',
  },
  {
    content: 'jq .items | length',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Get length of nested array',
  },
  {
    content: 'jq first',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get first element',
  },
  {
    content: 'jq last',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Get last element',
  },
  {
    content: 'jq reverse',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Reverse an array',
  },
  {
    content: 'jq sort',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Sort an array',
  },
  {
    content: 'jq unique',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Remove duplicates',
  },

  // === Selecting and Filtering ===
  {
    content: 'jq ".items[] | select(.active == true)"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Filter by condition',
  },
  {
    content: 'jq ".items[] | select(.price > 100)"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Filter by numeric comparison',
  },
  {
    content: 'jq "map(select(.status == \"done\"))"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Map and filter array',
  },

  // === Object Construction ===
  {
    content: 'jq "{name, email}"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Select specific fields',
  },
  {
    content: 'jq "{id: .userId, display: .name}"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Rename fields',
  },
  {
    content: 'jq "[.items[] | {name, price}]"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Transform array objects',
  },

  // === Transformations ===
  {
    content: 'jq "keys"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Get object keys',
  },
  {
    content: 'jq "values"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Get object values',
  },
  {
    content: 'jq "to_entries"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Convert to key-value pairs',
  },
  {
    content: 'jq "from_entries"',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Convert key-value pairs to object',
  },

  // === Raw Output ===
  {
    content: 'jq -r .name',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Raw output (no quotes)',
  },
  {
    content: 'jq -c .',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Compact output',
  },
];

export async function seedJqChallenges() {
  console.log('Seeding jq challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'jq'))
    .limit(1);

  if (!category) {
    console.error('Error: jq category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = jqChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${jqChallenges.length} jq challenges.`);
}

if (require.main === module) {
  seedJqChallenges()
    .catch((error) => {
      console.error('Seed jq failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed jq finished. Exiting...');
      process.exit(0);
    });
}
