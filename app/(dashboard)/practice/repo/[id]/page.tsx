import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { repoCategories, repoGeneratedChallenges, connectedRepos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getUserProfile } from '@/lib/db/queries';
import { hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { SeamlessSession } from '@/components/typing/SeamlessSession';
import { ArrowLeft, Github } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getRepoCategoryWithChallenges(categoryId: number, userId: number) {
  // Get the repo category
  const [category] = await db
    .select({
      id: repoCategories.id,
      name: repoCategories.name,
      slug: repoCategories.slug,
      description: repoCategories.description,
      icon: repoCategories.icon,
      challengeCount: repoCategories.challengeCount,
      repoId: repoCategories.repoId,
      repoOwner: connectedRepos.owner,
      repoName: connectedRepos.name,
    })
    .from(repoCategories)
    .innerJoin(connectedRepos, eq(repoCategories.repoId, connectedRepos.id))
    .where(
      and(
        eq(repoCategories.id, categoryId),
        eq(repoCategories.userId, userId)
      )
    )
    .limit(1);

  if (!category) {
    return null;
  }

  // Get the challenges for this category (selected ones only)
  const challenges = await db
    .select()
    .from(repoGeneratedChallenges)
    .where(
      and(
        eq(repoGeneratedChallenges.repoId, category.repoId),
        eq(repoGeneratedChallenges.userId, userId),
        eq(repoGeneratedChallenges.isSelected, true)
      )
    );

  return { category, challenges };
}

export default async function RepoPracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const data = await getRepoCategoryWithChallenges(categoryId, user.id);

  if (!data) {
    notFound();
  }

  const { category, challenges } = data;

  const profile = await getUserProfile(user.id);
  const isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');

  // No challenges
  if (challenges.length === 0) {
    return (
      <main className="min-h-screen bg-[#08090a]">
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-12 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to categories
          </Link>

          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-2xl font-medium text-white mb-4">{category.name}</h1>
            <p className="text-white/40 mb-4">No challenges available yet.</p>
            <Link
              href={`/dashboard/repos/${category.repoId}`}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Generate challenges from this repo →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Map repo challenges to the format SeamlessSession expects
  const mappedChallenges = challenges.map((challenge) => ({
    id: challenge.id,
    categoryId: 0, // Not used for repo challenges
    content: challenge.content,
    difficulty: challenge.difficulty,
    syntaxType: challenge.syntaxType,
    hint: challenge.hint,
    avgWpm: 0,
    timesCompleted: challenge.timesCompleted ?? 0,
    createdAt: challenge.createdAt,
    updatedAt: challenge.createdAt,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      icon: category.icon ?? null,
      difficulty: 'beginner' as const,
      isPremium: false,
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }));

  // Main practice view - seamless session
  return (
    <main className="min-h-screen bg-[#08090a]">
      <div className="max-w-[900px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to categories</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <Github className="h-4 w-4 text-white/40" />
              <h1 className="text-base font-medium text-white">{category.name}</h1>
            </div>
            <p className="text-xs text-white/40">
              {challenges.length} challenges from {category.repoOwner}/{category.repoName}
            </p>
          </div>
        </div>

        {/* Free tier time remaining */}
        {isFreeTier && (
          <div className="mb-6">
            <RemainingTimeBar />
          </div>
        )}

        {/* Seamless practice session */}
        <SeamlessSession
          challenges={mappedChallenges}
          categorySlug={`repo-${category.id}`}
          categoryName={category.name}
        />
      </div>
    </main>
  );
}
