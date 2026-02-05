import Link from 'next/link';
import {
  getCategories,
  getUser,
  getUserProfile,
  getUserStatsOverview,
  getCategoryPerformance,
  getRecentSessionsForAdaptive,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { Category } from '@/lib/db/schema';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { PracticeRecommendations } from '@/components/practice/PracticeRecommendations';
import { generateRecommendations } from '@/lib/practice/recommendations';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import type { DifficultyLevel, SessionPerformance } from '@/lib/practice/adaptive-difficulty';
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
  Lock,
  Crosshair,
  Brain,
  LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Practice',
  description: 'Choose from categories including git workflows, Docker commands, React patterns, bash scripts, and AI prompt engineering. Build muscle memory with targeted practice.',
  openGraph: {
    title: 'Practice - Choose Your Category',
    description: 'Master git, Docker, React, bash, and AI prompts through deliberate typing practice.',
    url: '/practice',
  },
  twitter: {
    title: 'Practice - Choose Your Category',
    description: 'Master git, Docker, React, bash, and AI prompts through deliberate typing practice.',
  },
};

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

function CategoryCard({ category, locked }: { category: Category; locked: boolean }) {
  const IconComponent = iconMap[category.icon || ''] || Code;
  const difficultyClass = difficultyColors[category.difficulty] || difficultyColors.beginner;

  if (locked) {
    return (
      <div className="group relative block rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
            <Lock className="h-3 w-3" />
            Pro
          </span>
        </div>

        <div className="pointer-events-none blur-[2px] select-none">
          <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <h3 className="mb-2 text-base sm:text-lg font-semibold text-gray-900">
            {category.name}
          </h3>

          <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 line-clamp-2">
            {category.description}
          </p>

          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${difficultyClass}`}>
              {category.difficulty}
            </span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Upgrade to Unlock
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/practice/${category.slug}`}
      className="group relative block rounded-xl border border-gray-200 bg-white p-4 sm:p-6 transition-all hover:border-orange-300 hover:shadow-lg"
    >
      {category.isPremium && (
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
            <Lock className="h-3 w-3" />
            Pro
          </span>
        </div>
      )}

      <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-500 text-white">
        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>

      <h3 className="mb-2 text-base sm:text-lg font-semibold text-gray-900 group-hover:text-orange-600">
        {category.name}
      </h3>

      <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 line-clamp-2">
        {category.description}
      </p>

      <div className="flex items-center gap-2">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${difficultyClass}`}>
          {category.difficulty}
        </span>
      </div>
    </Link>
  );
}

export default async function PracticePage() {
  const [categories, user] = await Promise.all([
    getCategories(),
    getUser(),
  ]);

  let canAccessPremium = false;
  let isFreeTier = true;
  let recommendations: Awaited<ReturnType<typeof generateRecommendations>> = [];

  if (user) {
    const [
      profile,
      stats,
      categoryPerformance,
      recentSessions,
      keyData,
      errorPatterns,
      problemSeqs,
    ] = await Promise.all([
      getUserProfile(user.id),
      getUserStatsOverview(),
      getCategoryPerformance(),
      getRecentSessionsForAdaptive(10),
      getKeyAccuracyForUser(user.id),
      getCharErrorPatternsForUser(user.id),
      getProblemSequences(user.id, 10),
    ]);

    canAccessPremium = canAccessPremiumCategories(profile?.subscriptionTier ?? 'free');
    isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');

    const weaknessReport =
      keyData.length > 0 || errorPatterns.length > 0 || problemSeqs.length > 0
        ? analyzeWeaknesses(keyData, errorPatterns, problemSeqs)
        : null;

    const sessionPerformance: SessionPerformance[] = recentSessions.map((s) => ({
      wpm: s.wpm,
      accuracy: s.accuracy,
      errors: s.errors,
      keystrokes: s.keystrokes,
      durationMs: s.durationMs,
      challengeDifficulty: s.challengeDifficulty as DifficultyLevel,
    }));

    recommendations = generateRecommendations({
      sessions: sessionPerformance,
      weaknessReport,
      categoryPerformance,
      allCategories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        difficulty: c.difficulty,
        isPremium: c.isPremium,
      })),
      currentStreak: profile?.currentStreak ?? 0,
      totalSessions: stats.totalSessions,
      avgWpm: stats.avgWpm,
      avgAccuracy: stats.avgAccuracy,
      canAccessPremium,
    });
  }

  const freeCategories = categories.filter((c) => !c.isPremium);
  const premiumCategories = categories.filter((c) => c.isPremium);

  // For free users, only show categories they can access
  const accessibleCategories = canAccessPremium ? categories : freeCategories;
  const displayFreeCategories = canAccessPremium ? freeCategories : accessibleCategories;
  const displayPremiumCategories = canAccessPremium ? premiumCategories : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {user && isFreeTier && (
        <div className="mb-6 sm:mb-8">
          <RemainingTimeBar />
        </div>
      )}

      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
          Choose a Category
        </h1>
        <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-600 px-4">
          Build muscle memory for commands and patterns you use every day
        </p>
      </div>

      {/* Practice Recommendations */}
      {user && recommendations.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <PracticeRecommendations recommendations={recommendations} />
        </section>
      )}

      {/* Smart & Personalized Practice Cards */}
      {user && (
        <section className="mb-8 sm:mb-12 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          <Link
            href="/practice/smart"
            className="group block rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 p-4 sm:p-6 transition-all hover:border-violet-400 hover:bg-violet-100 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-violet-500 text-white flex-shrink-0">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-violet-600">
                  Smart Practice
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  AI picks optimal challenges based on your difficulty level and weaknesses
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/practice/personalized"
            className="group block rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 sm:p-6 transition-all hover:border-orange-400 hover:bg-orange-100 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-500 text-white flex-shrink-0">
                <Crosshair className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                  Personalized Practice
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  Targeted exercises based on your error patterns, weak keys, and slow sequences
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {displayFreeCategories.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900">
            {canAccessPremium ? 'Free' : 'Categories'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayFreeCategories.map((category) => (
              <CategoryCard key={category.id} category={category} locked={false} />
            ))}
          </div>
        </section>
      )}

      {displayPremiumCategories.length > 0 && (
        <section>
          <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-gray-900">Pro</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayPremiumCategories.map((category) => (
              <CategoryCard key={category.id} category={category} locked={false} />
            ))}
          </div>
        </section>
      )}

      {accessibleCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories available yet.</p>
        </div>
      )}
    </main>
  );
}
