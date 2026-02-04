import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Terminal Commands challenges covering core shell commands:
 * cd, ls, pwd, find, grep, cat, head, tail, pipes, redirects,
 * mkdir, rm, cp, mv, touch, chmod, echo, which, man, history
 *
 * 30 challenges total, varying in difficulty:
 * - beginner: simple single commands
 * - intermediate: commands with common options/flags
 * - advanced: pipes, redirects, and command combinations
 */
export const terminalCommandsChallenges = [
  // === NAVIGATION (4 challenges) ===
  {
    content: 'cd /var/log',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Change directory to /var/log',
  },
  {
    content: 'cd ..',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Go up one directory level',
  },
  {
    content: 'cd ~',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Change to home directory',
  },
  {
    content: 'pwd',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Print working directory',
  },

  // === LISTING FILES (4 challenges) ===
  {
    content: 'ls',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List directory contents',
  },
  {
    content: 'ls -la',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'List all files with details',
  },
  {
    content: 'ls -lh',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'List files with human-readable sizes',
  },
  {
    content: 'ls -R src/',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Recursively list files in src directory',
  },

  // === FIND (3 challenges) ===
  {
    content: 'find . -name "*.js"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Find all JavaScript files in current directory',
  },
  {
    content: 'find /tmp -type f -mtime -1',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Find files modified in the last day',
  },
  {
    content: 'find . -name "*.log" -delete',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Find and delete all log files',
  },

  // === GREP (4 challenges) ===
  {
    content: 'grep "error" app.log',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Search for "error" in a log file',
  },
  {
    content: 'grep -i "warning" server.log',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Case-insensitive search for "warning"',
  },
  {
    content: 'grep -r "TODO" src/',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Recursively search for TODO comments',
  },
  {
    content: 'grep -n "function" index.js',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Search with line numbers',
  },

  // === FILE VIEWING (4 challenges) ===
  {
    content: 'cat README.md',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Display contents of a file',
  },
  {
    content: 'head -n 20 output.log',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show first 20 lines of a file',
  },
  {
    content: 'tail -f /var/log/syslog',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Follow log file in real-time',
  },
  {
    content: 'tail -n 50 error.log',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Show last 50 lines of a file',
  },

  // === FILE OPERATIONS (4 challenges) ===
  {
    content: 'mkdir -p src/components',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create nested directories',
  },
  {
    content: 'touch index.ts',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Create an empty file',
  },
  {
    content: 'cp config.json config.backup.json',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Copy a file to a backup',
  },
  {
    content: 'mv old-name.ts new-name.ts',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Rename a file',
  },

  // === PIPES AND REDIRECTS (4 challenges) ===
  {
    content: 'cat file.txt | grep "pattern"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Pipe file contents to grep',
  },
  {
    content: 'ls -la > files.txt',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Redirect directory listing to a file',
  },
  {
    content: 'echo "hello" >> output.log',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Append text to a file',
  },
  {
    content: 'cat access.log | sort | uniq -c',
    difficulty: 'advanced' as const,
    syntaxType: 'bash' as const,
    hint: 'Sort and count unique lines',
  },

  // === UTILITY COMMANDS (3 challenges) ===
  {
    content: 'which node',
    difficulty: 'beginner' as const,
    syntaxType: 'bash' as const,
    hint: 'Find the path to an executable',
  },
  {
    content: 'chmod +x script.sh',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Make a script executable',
  },
  {
    content: 'history | grep "git"',
    difficulty: 'intermediate' as const,
    syntaxType: 'bash' as const,
    hint: 'Search command history for git commands',
  },
];

export async function seedTerminalCommandsChallenges() {
  console.log('Seeding Terminal Commands challenges...');

  // Get the Terminal Commands category
  const [terminalCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'terminal-commands'))
    .limit(1);

  if (!terminalCategory) {
    console.error('Error: Terminal Commands category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = terminalCategory.id;

  // Insert challenges
  const challengeData = terminalCommandsChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${terminalCommandsChallenges.length} Terminal Commands challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedTerminalCommandsChallenges()
    .catch((error) => {
      console.error('Seed Terminal Commands failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Terminal Commands finished. Exiting...');
      process.exit(0);
    });
}
