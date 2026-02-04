import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryWithChallenges, getUser, getUserProfile } from '@/lib/db/queries';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import {
  GitBranch,
  GitMerge,
  Terminal,
  Code,
  FileType,
  Container,
  Package,
  Layers,
  Sparkles,
  Database,
  ArrowLeft,
  Lock,
  LucideIcon,
} from 'lucide-react';

export const revalidate = 3600;

const iconMap: Record<string, LucideIcon> = {
  'git-branch': GitBranch,
  'git-merge': GitMerge,
  terminal: Terminal,
  code: Code,
  'file-type': FileType,
  container: Container,
  package: Package,
  layers: Layers,
  sparkles: Sparkles,
  database: Database,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

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

  const IconComponent = iconMap[category.icon || ''] || Code;
  const difficultyClass = difficultyColors[category.difficulty] || difficultyColors.beginner;

  if (isLocked) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500 text-white">
              <IconComponent className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {category.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                  <Lock className="h-3 w-3" />
                  Pro
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}>
                  {category.difficulty}
                </span>
                <span className="text-sm text-gray-500">
                  {category.challenges.length} {category.challenges.length === 1 ? 'challenge' : 'challenges'}
                </span>
              </div>
            </div>
          </div>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        <div className="relative">
          <div className="pointer-events-none blur-sm select-none">
            <div className="space-y-3">
              {category.challenges.slice(0, 3).map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <code className="text-sm text-gray-700">{challenge.content.slice(0, 50)}...</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Premium Category
              </h2>
              <p className="mb-6 max-w-sm text-gray-600">
                Upgrade to Pro to unlock {category.name} and all premium categories with unlimited practice time.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                <Lock className="h-4 w-4" />
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {user && isFreeTier && (
        <div className="mb-6">
          <RemainingTimeBar />
        </div>
      )}

      <Link
        href="/practice"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to categories
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500 text-white">
            <IconComponent className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {category.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyClass}`}>
                {category.difficulty}
              </span>
              <span className="text-sm text-gray-500">
                {category.challenges.length} {category.challenges.length === 1 ? 'challenge' : 'challenges'}
              </span>
            </div>
          </div>
        </div>
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
      </div>

      {category.challenges.length > 0 ? (
        <div className="space-y-3">
          {category.challenges.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              categorySlug={categorySlug}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">No challenges available for this category yet.</p>
        </div>
      )}
    </main>
  );
}
