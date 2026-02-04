import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * AI Prompts challenges covering prompting patterns for:
 * Claude, ChatGPT, Cursor, and Copilot
 *
 * 30 challenges total, varying in difficulty:
 * - beginner: simple prompts and basic patterns
 * - intermediate: structured prompts with context
 * - advanced: complex multi-turn patterns and system prompts
 */
export const aiPromptsChallenges = [
  // === Claude Patterns (8 challenges) ===
  {
    content: 'You are a helpful assistant. Please respond concisely.',
    difficulty: 'beginner' as const,
    syntaxType: 'prompt' as const,
    hint: 'Basic Claude system prompt',
  },
  {
    content: 'Think step by step before providing your final answer.',
    difficulty: 'beginner' as const,
    syntaxType: 'prompt' as const,
    hint: 'Chain of thought prompting',
  },
  {
    content: 'Format your response as JSON with keys: title, summary, tags',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Structured output format instruction',
  },
  {
    content: '<context>{{CONTEXT}}</context> Answer based only on the context above.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'XML tag pattern for context injection',
  },
  {
    content: 'If you are unsure, say "I don\'t know" instead of guessing.',
    difficulty: 'beginner' as const,
    syntaxType: 'prompt' as const,
    hint: 'Uncertainty handling instruction',
  },
  {
    content: '<examples>\n<example>Input: X Output: Y</example>\n</examples>',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Few-shot learning with XML examples',
  },
  {
    content: 'You are an expert TypeScript developer. Review this code for bugs and security issues.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Role-based code review prompt',
  },
  {
    content: 'First, explain your reasoning in <thinking> tags, then provide the answer in <answer> tags.',
    difficulty: 'advanced' as const,
    syntaxType: 'prompt' as const,
    hint: 'Structured reasoning with XML tags',
  },

  // === ChatGPT Patterns (8 challenges) ===
  {
    content: 'Act as a senior software engineer with 10 years of experience.',
    difficulty: 'beginner' as const,
    syntaxType: 'prompt' as const,
    hint: 'Role assignment for ChatGPT',
  },
  {
    content: 'Explain this concept like I\'m a complete beginner.',
    difficulty: 'beginner' as const,
    syntaxType: 'prompt' as const,
    hint: 'Audience-level instruction',
  },
  {
    content: 'Give me 5 examples, then summarize the key takeaways.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Multi-part response structure',
  },
  {
    content: 'Compare and contrast: Option A vs Option B. Use a table format.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Comparison with table format',
  },
  {
    content: 'You are a code reviewer. Focus on: 1) bugs 2) performance 3) readability',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Structured review criteria',
  },
  {
    content: 'Generate a regex pattern that matches email addresses. Explain each part.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Technical generation with explanation',
  },
  {
    content: 'You are a helpful assistant that only responds in valid JSON.',
    difficulty: 'intermediate' as const,
    syntaxType: 'prompt' as const,
    hint: 'Output format constraint',
  },
  {
    content: 'Break down this complex problem into smaller sub-problems, then solve each one.',
    difficulty: 'advanced' as const,
    syntaxType: 'prompt' as const,
    hint: 'Problem decomposition prompt',
  },

  // === Cursor Patterns (7 challenges) ===
  {
    content: '// TODO: implement user authentication with JWT',
    difficulty: 'beginner' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor TODO comment for code generation',
  },
  {
    content: '// Fix: handle null case in user lookup',
    difficulty: 'beginner' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor fix comment',
  },
  {
    content: '// Refactor: extract validation logic into separate function',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor refactor instruction',
  },
  {
    content: '// Add error handling for API calls with retry logic',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor feature addition comment',
  },
  {
    content: '// Convert this callback-based code to async/await',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor code modernization',
  },
  {
    content: '// Write unit tests for this function using vitest',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor test generation comment',
  },
  {
    content: '// Optimize: reduce time complexity from O(n²) to O(n)',
    difficulty: 'advanced' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Cursor optimization instruction',
  },

  // === Copilot Patterns (7 challenges) ===
  {
    content: '// Function to validate email address format',
    difficulty: 'beginner' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot function description',
  },
  {
    content: '/** @param {string} input - The string to sanitize @returns {string} */`',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot JSDoc for type hints',
  },
  {
    content: '// Parse CSV string into array of objects with headers as keys',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot data transformation comment',
  },
  {
    content: 'interface UserService { findById(id: string): Promise<User | null>; }',
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Copilot interface-driven implementation',
  },
  {
    content: '// Sort array by multiple fields: first by date desc, then by name asc',
    difficulty: 'intermediate' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot complex sorting comment',
  },
  {
    content: '// Debounce function that delays execution until after wait ms have elapsed',
    difficulty: 'advanced' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot utility function description',
  },
  {
    content: '// Implement rate limiter: max 100 requests per minute per IP',
    difficulty: 'advanced' as const,
    syntaxType: 'code-comment' as const,
    hint: 'Copilot algorithm specification',
  },
];

export async function seedAiPromptsChallenges() {
  console.log('Seeding AI Prompts challenges...');

  // Get the AI Prompts category
  const [aiPromptsCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'ai-prompts'))
    .limit(1);

  if (!aiPromptsCategory) {
    console.error('Error: AI Prompts category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = aiPromptsCategory.id;

  // Insert challenges
  const challengeData = aiPromptsChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${aiPromptsChallenges.length} AI Prompts challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedAiPromptsChallenges()
    .catch((error) => {
      console.error('Seed AI Prompts failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed AI Prompts finished. Exiting...');
      process.exit(0);
    });
}
