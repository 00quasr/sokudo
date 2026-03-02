import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * tmux challenges
 *
 * 25 challenges covering:
 * - Sessions management
 * - Windows and panes
 * - Copy mode and navigation
 */
export const tmuxChallenges = [
  // === Session Management ===
  {
    content: 'tmux',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Start a new tmux session',
  },
  {
    content: 'tmux new -s dev',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create named session',
  },
  {
    content: 'tmux ls',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List sessions',
  },
  {
    content: 'tmux attach',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Attach to last session',
  },
  {
    content: 'tmux attach -t dev',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Attach to named session',
  },
  {
    content: 'tmux kill-session -t dev',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Kill a session',
  },
  {
    content: 'tmux kill-server',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Kill all tmux sessions',
  },

  // === Prefix Commands (Ctrl+b by default) ===
  {
    content: 'Ctrl+b d',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Detach from session',
  },
  {
    content: 'Ctrl+b c',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create new window',
  },
  {
    content: 'Ctrl+b n',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Next window',
  },
  {
    content: 'Ctrl+b p',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Previous window',
  },
  {
    content: 'Ctrl+b 0',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to window 0',
  },
  {
    content: 'Ctrl+b ,',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Rename current window',
  },
  {
    content: 'Ctrl+b &',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Kill current window',
  },

  // === Panes ===
  {
    content: 'Ctrl+b %',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Split pane vertically',
  },
  {
    content: 'Ctrl+b "',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Split pane horizontally',
  },
  {
    content: 'Ctrl+b o',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Switch to next pane',
  },
  {
    content: 'Ctrl+b x',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Kill current pane',
  },
  {
    content: 'Ctrl+b z',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Toggle pane zoom',
  },
  {
    content: 'Ctrl+b {',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Swap pane left',
  },
  {
    content: 'Ctrl+b }',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Swap pane right',
  },
  {
    content: 'Ctrl+b Space',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Cycle pane layouts',
  },

  // === Copy Mode ===
  {
    content: 'Ctrl+b [',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Enter copy mode',
  },
  {
    content: 'Ctrl+b ]',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Paste buffer',
  },

  // === Advanced ===
  {
    content: 'Ctrl+b :',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Enter command mode',
  },
  {
    content: 'Ctrl+b ?',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List key bindings',
  },
  {
    content: 'tmux source-file ~/.tmux.conf',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Reload tmux config',
  },
  {
    content: 'Ctrl+b s',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show session list',
  },
  {
    content: 'Ctrl+b w',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show window list',
  },
];

export async function seedTmuxChallenges() {
  console.log('Seeding tmux challenges...');

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'tmux'))
    .limit(1);

  if (!category) {
    console.error('Error: tmux category not found. Run db:seed first.');
    process.exit(1);
  }

  const challengeData = tmuxChallenges.map((challenge) => ({
    ...challenge,
    categoryId: category.id,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${tmuxChallenges.length} tmux challenges.`);
}

if (require.main === module) {
  seedTmuxChallenges()
    .catch((error) => {
      console.error('Seed tmux failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed tmux finished. Exiting...');
      process.exit(0);
    });
}
