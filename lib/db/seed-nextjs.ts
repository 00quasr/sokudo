import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Next.js challenges covering App Router, Server Actions, metadata, and routing:
 * - App Router file conventions (page, layout, loading, error)
 * - Server Actions and form handling
 * - Metadata API for SEO
 * - Dynamic and parallel routing
 *
 * 20 challenges total, varying in difficulty:
 * - beginner: basic file conventions and exports
 * - intermediate: server actions, metadata, dynamic routes
 * - advanced: parallel routes, intercepting routes, middleware
 */
export const nextjsChallenges = [
  // === App Router File Conventions (5 challenges) ===
  {
    content: 'export default function Page() { return <div>Hello</div> }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Basic page component export',
  },
  {
    content: 'export default function Layout({ children }: { children: React.ReactNode }) { return <main>{children}</main> }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Layout component with children prop',
  },
  {
    content: 'export default function Loading() { return <div>Loading...</div> }',
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Loading UI component',
  },
  {
    content: "export default function Error({ error, reset }: { error: Error; reset: () => void }) { return <button onClick={reset}>Retry</button> }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Error boundary component with reset',
  },
  {
    content: "export default function NotFound() { return <h1>404 - Page Not Found</h1> }",
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Not found page component',
  },

  // === Server Actions (5 challenges) ===
  {
    content: "'use server'",
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Server action directive',
  },
  {
    content: "async function createPost(formData: FormData) { 'use server'; const title = formData.get('title') }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Server action with FormData',
  },
  {
    content: "const [state, action] = useActionState(serverAction, initialState)",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'useActionState hook for form state',
  },
  {
    content: "revalidatePath('/posts')",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Revalidate cached data for a path',
  },
  {
    content: "revalidateTag('posts')",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Revalidate cached data by tag',
  },

  // === Metadata API (5 challenges) ===
  {
    content: "export const metadata: Metadata = { title: 'My App' }",
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Static metadata export',
  },
  {
    content: "export async function generateMetadata({ params }: Props): Promise<Metadata> { return { title: params.slug } }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Dynamic metadata generation',
  },
  {
    content: "export const metadata: Metadata = { title: { template: '%s | My App', default: 'My App' } }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Metadata with title template',
  },
  {
    content: "export const metadata: Metadata = { openGraph: { title: 'My App', description: 'Welcome' } }",
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'OpenGraph metadata for social sharing',
  },
  {
    content: "export const metadata: Metadata = { robots: { index: true, follow: true } }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Robots metadata for SEO',
  },

  // === Dynamic and Parallel Routing (5 challenges) ===
  {
    content: "export default function Page({ params }: { params: { slug: string } }) { return <div>{params.slug}</div> }",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Dynamic route with params',
  },
  {
    content: "export async function generateStaticParams() { return [{ slug: 'hello' }, { slug: 'world' }] }",
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Generate static params for dynamic routes',
  },
  {
    content: "export default function Layout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) { return <>{children}{modal}</> }",
    difficulty: 'advanced' as const,
    syntaxType: 'typescript' as const,
    hint: 'Parallel routes with slots',
  },
  {
    content: "import { redirect } from 'next/navigation'",
    difficulty: 'beginner' as const,
    syntaxType: 'typescript' as const,
    hint: 'Import redirect function',
  },
  {
    content: "import { useRouter, usePathname, useSearchParams } from 'next/navigation'",
    difficulty: 'intermediate' as const,
    syntaxType: 'typescript' as const,
    hint: 'Navigation hooks import',
  },
];

export async function seedNextjsChallenges() {
  console.log('Seeding Next.js challenges...');

  // Get the Next.js category
  const [nextjsCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'nextjs'))
    .limit(1);

  if (!nextjsCategory) {
    console.error('Error: Next.js category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = nextjsCategory.id;

  // Insert challenges
  const challengeData = nextjsChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${nextjsChallenges.length} Next.js challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedNextjsChallenges()
    .catch((error) => {
      console.error('Seed Next.js failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed Next.js finished. Exiting...');
      process.exit(0);
    });
}
