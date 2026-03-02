import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Vim challenges
 *
 * 35 challenges covering:
 * - Navigation and motions
 * - Editing and text objects
 * - Search, commands, and macros
 */
export const vimChallenges = [
  // === Basic Navigation ===
  {
    content: 'h',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move cursor left',
  },
  {
    content: 'j',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move cursor down',
  },
  {
    content: 'k',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move cursor up',
  },
  {
    content: 'l',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move cursor right',
  },
  {
    content: 'w',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move to start of next word',
  },
  {
    content: 'b',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move to start of previous word',
  },
  {
    content: 'e',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move to end of word',
  },
  {
    content: '0',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move to start of line',
  },
  {
    content: '$',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Move to end of line',
  },
  {
    content: 'gg',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Go to first line',
  },
  {
    content: 'G',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Go to last line',
  },

  // === Insert Mode ===
  {
    content: 'i',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Insert before cursor',
  },
  {
    content: 'a',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Append after cursor',
  },
  {
    content: 'o',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Open line below',
  },
  {
    content: 'O',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Open line above',
  },
  {
    content: 'A',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Append at end of line',
  },
  {
    content: 'I',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Insert at start of line',
  },

  // === Editing ===
  {
    content: 'dd',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete current line',
  },
  {
    content: 'yy',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Yank (copy) current line',
  },
  {
    content: 'p',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Paste after cursor',
  },
  {
    content: 'x',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete character under cursor',
  },
  {
    content: 'u',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Undo',
  },
  {
    content: 'Ctrl+r',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Redo',
  },
  {
    content: 'dw',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete word',
  },
  {
    content: 'cw',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Change word',
  },
  {
    content: 'ciw',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Change inner word',
  },
  {
    content: 'ci"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Change inside quotes',
  },
  {
    content: 'di(',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Delete inside parentheses',
  },

  // === Search ===
  {
    content: '/pattern',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Search forward for pattern',
  },
  {
    content: 'n',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Next search result',
  },
  {
    content: 'N',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Previous search result',
  },
  {
    content: ':%s/old/new/g',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Replace all occurrences',
  },
  {
    content: ':s/old/new/g',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Replace on current line',
  },

  // === Commands ===
  {
    content: ':w',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Save file',
  },
  {
    content: ':q',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Quit vim',
  },
  {
    content: ':wq',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Save and quit',
  },
  {
    content: ':q!',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Quit without saving',
  },
  {
    content: 'ZZ',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Save and quit (shortcut)',
  },
  {
    content: ':e filename',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Open a file',
  },

  // === Advanced ===
  {
    content: 'v',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Enter visual mode',
  },
  {
    content: 'V',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Enter visual line mode',
  },
  {
    content: '.',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Repeat last change',
  },
  {
    content: '*',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Search word under cursor',
  },
  {
    content: 'ggVG',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Select entire file',
  },
];

export async function seedVimChallenges() {
  console.log('Seeding Vim challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'vim'))
    .limit(1);

  if (!category) {
    console.error('Error: Vim category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = vimChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${vimChallenges.length} Vim challenges.`);
}

if (require.main === module) {
  seedVimChallenges()
    .catch((error) => {
      console.error('Seed Vim failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Vim finished. Exiting...');
      process.exit(0);
    });
}
