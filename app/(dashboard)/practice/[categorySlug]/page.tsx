import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryWithChallenges, getUser, getUserProfile } from '@/lib/db/queries';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { SeamlessSession } from '@/components/typing/SeamlessSession';
import { ArrowLeft, Lock } from 'lucide-react';

export const revalidate = 3600;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const [category, user] = await Promise.all([
    getCategoryWithChallenges(categorySlug),
    getUser(),
  ]);

  if (!category) {
    notFound();
  }

  let canAccessPremium = false;
  let isFreeTier = true;
  if (user) {
    const profile = await getUserProfile(user.id);
    canAccessPremium = canAccessPremiumCategories(profile?.subscriptionTier ?? 'free');
    isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');
  }

  const isLocked = category.isPremium && !canAccessPremium;

  // Locked state - show upgrade prompt
  if (isLocked) {
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
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
              <Lock className="h-10 w-10 text-white/40" />
            </div>
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-3">
              {category.name}
            </h1>
            <p className="text-white/50 mb-2">
              {category.challenges.length} challenges
            </p>
            <p className="text-white/40 max-w-md mb-8">
              Upgrade to Pro to unlock this category and get unlimited practice time.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // No challenges
  if (category.challenges.length === 0) {
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
            <p className="text-white/40">No challenges available yet.</p>
          </div>
        </div>
      </main>
    );
  }

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
            <h1 className="text-base font-medium text-white">{category.name}</h1>
            <p className="text-xs text-white/40">{category.challenges.length} challenges</p>
          </div>
        </div>

        {/* Free tier time remaining */}
        {user && isFreeTier && (
          <div className="mb-6">
            <RemainingTimeBar />
          </div>
        )}

        {/* Seamless practice session */}
        <SeamlessSession
          challenges={category.challenges.map(c => ({ ...c, category }))}
          categorySlug={categorySlug}
          categoryName={category.name}
        />
      </div>
    </main>
  );
}
