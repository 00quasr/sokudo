import Link from 'next/link';
import {
  getCategories,
  getUser,
  getUserProfile,
  getUserStatsOverview,
} from '@/lib/db/queries';
import { Category } from '@/lib/db/schema';
import { canAccessPremiumCategories, hasUnlimitedPractice } from '@/lib/limits/constants';
import { RemainingTimeBar } from '@/components/limits/RemainingTimeBar';
import { getUserRepoCategories } from '@/lib/repo-scanner';
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
  Play,
  Brain,
  Crosshair,
  LucideIcon,
  ArrowRight,
  Github,
  Zap,
  Target,
  Trophy,
} from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Practice',
  description: 'Choose from categories including git workflows, Docker commands, React patterns, bash scripts, and AI prompt engineering. Build muscle memory with targeted practice.',
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

const iconColors: Record<string, { bg: string; text: string; hoverBg: string }> = {
  'git-branch': { bg: 'bg-orange-500/20', text: 'text-orange-400', hoverBg: 'group-hover:bg-orange-500/30' },
  'git-merge': { bg: 'bg-orange-500/20', text: 'text-orange-400', hoverBg: 'group-hover:bg-orange-500/30' },
  terminal: { bg: 'bg-green-500/20', text: 'text-green-400', hoverBg: 'group-hover:bg-green-500/30' },
  code: { bg: 'bg-blue-500/20', text: 'text-blue-400', hoverBg: 'group-hover:bg-blue-500/30' },
  'file-type': { bg: 'bg-purple-500/20', text: 'text-purple-400', hoverBg: 'group-hover:bg-purple-500/30' },
  container: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', hoverBg: 'group-hover:bg-cyan-500/30' },
  package: { bg: 'bg-red-500/20', text: 'text-red-400', hoverBg: 'group-hover:bg-red-500/30' },
  layers: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', hoverBg: 'group-hover:bg-indigo-500/30' },
  sparkles: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hoverBg: 'group-hover:bg-yellow-500/30' },
  database: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', hoverBg: 'group-hover:bg-emerald-500/30' },
};
const defaultIconColor = { bg: 'bg-white/[0.06]', text: 'text-white/50', hoverBg: 'group-hover:bg-white/10 group-hover:text-white/70' };

function CategoryCard({ category, locked }: { category: Category; locked: boolean }) {
  const IconComponent = iconMap[category.icon || ''] || Code;
  const iconColor = iconColors[category.icon || ''] || defaultIconColor;

  if (locked) {
    return (
      <div className="group relative rounded-2xl bg-white/[0.02] p-6 opacity-60">
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60">
            <Lock className="h-3 w-3" />
            Pro
          </span>
        </div>

        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40">
          <IconComponent className="h-5 w-5" />
        </div>

        <h3 className="text-base font-medium text-white/50 mb-2">
          {category.name}
        </h3>

        <p className="text-sm text-white/30 line-clamp-2 mb-4">
          {category.description}
        </p>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Upgrade to unlock
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/practice/${category.slug}`}
      className="group relative rounded-2xl bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors"
    >
      {category.isPremium && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60">
            Pro
          </span>
        </div>
      )}

      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${iconColor.bg} ${iconColor.text} ${iconColor.hoverBg} transition-colors`}>
        <IconComponent className="h-5 w-5" />
      </div>

      <h3 className="text-base font-medium text-white mb-2 group-hover:text-white transition-colors">
        {category.name}
      </h3>

      <p className="text-sm text-white/50 line-clamp-2 mb-4">
        {category.description}
      </p>

      <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
        <Play className="h-3.5 w-3.5" />
        <span>Start practice</span>
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
  let stats = null;
  let repoCategories: Awaited<ReturnType<typeof getUserRepoCategories>> = [];

  if (user) {
    const [profile, userStats, userRepoCategories] = await Promise.all([
      getUserProfile(user.id),
      getUserStatsOverview(),
      getUserRepoCategories(user.id),
    ]);
    canAccessPremium = canAccessPremiumCategories(profile?.subscriptionTier ?? 'free');
    isFreeTier = !hasUnlimitedPractice(profile?.subscriptionTier ?? 'free');
    stats = userStats;
    repoCategories = userRepoCategories;
  }

  const freeCategories = categories.filter((c) => !c.isPremium);
  const premiumCategories = categories.filter((c) => c.isPremium);

  return (
    <main className="min-h-screen bg-[#08090a]">
      <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-16">
        {/* Free tier time bar */}
        {user && isFreeTier && (
          <div className="mb-10">
            <RemainingTimeBar />
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl md:text-3xl font-medium text-white">
            Practice
          </h1>
          <p className="mt-2 text-white/50">
            Select a category to start a seamless typing session
          </p>
        </div>

        {/* Quick stats for logged in users */}
        {user && stats && stats.totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/20">
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-white">
                    {Math.round(stats.avgWpm)}
                  </p>
                  <p className="text-xs text-white/40">Avg WPM</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/20">
                  <Target className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-white">
                    {Math.round(stats.avgAccuracy)}%
                  </p>
                  <p className="text-xs text-white/40">Accuracy</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/20">
                  <Trophy className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-white">
                    {stats.totalSessions}
                  </p>
                  <p className="text-xs text-white/40">Sessions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart practice options for logged in users */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
            <Link
              href="/practice/smart"
              className="group rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/30 transition-colors">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-white">
                    Smart practice
                  </h3>
                  <p className="text-xs text-white/40">
                    AI picks challenges based on your level
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/practice/personalized"
              className="group rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                  <Crosshair className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-white">
                    Personalized practice
                  </h3>
                  <p className="text-xs text-white/40">
                    Target your weak spots and error patterns
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/repos/connect"
              className="group rounded-xl bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors border border-dashed border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-white">
                    Import from GitHub
                  </h3>
                  <p className="text-xs text-white/40">
                    Generate challenges from your repos
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* User's Repo Categories */}
        {repoCategories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/40">
                Your GitHub imports
              </h2>
              <Link
                href="/dashboard/repos"
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Manage repos →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {repoCategories.map((repoCategory) => (
                <Link
                  key={repoCategory.id}
                  href={`/practice/repo/${repoCategory.id}`}
                  className="group relative rounded-2xl bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors border border-white/[0.04]"
                >
                  <div className="absolute right-4 top-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60">
                      <Github className="h-3 w-3" />
                      Repo
                    </span>
                  </div>

                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                    <GitBranch className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-medium text-white mb-1 group-hover:text-white transition-colors">
                    {repoCategory.name}
                  </h3>

                  <p className="text-xs text-white/40 mb-2">
                    {repoCategory.repoOwner}/{repoCategory.repoName}
                  </p>

                  <p className="text-sm text-white/50 line-clamp-2 mb-4">
                    {repoCategory.description || `${repoCategory.challengeCount} challenges from this repository`}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                    <Play className="h-3.5 w-3.5" />
                    <span>Start practice</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {freeCategories.length > 0 && (
          <section className="mb-10">
            {(canAccessPremium && premiumCategories.length > 0) || repoCategories.length > 0 ? (
              <h2 className="text-sm font-medium text-white/40 mb-4">
                {repoCategories.length > 0 ? 'Built-in categories' : 'Free categories'}
              </h2>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} locked={false} />
              ))}
            </div>
          </section>
        )}

        {/* Premium categories */}
        {premiumCategories.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-white/40 mb-4">
              Pro categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {premiumCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  locked={!canAccessPremium}
                />
              ))}
            </div>
          </section>
        )}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40">No categories available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
