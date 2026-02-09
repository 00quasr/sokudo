import { getPublicChallenges } from '@/lib/db/queries';
import { CommunityBrowser } from './community-browser';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CommunityChallengePage() {
  const initialData = await getPublicChallenges({ page: 1, limit: 20 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Community Challenges
        </h1>
        <p className="mt-3 text-lg text-white/60">
          Browse and practice typing challenges created by the community
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/challenges/search"
            className="text-sm text-white/50 hover:text-orange-600"
          >
            Browse Built-in Challenges
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/practice"
            className="text-sm text-white/50 hover:text-orange-600"
          >
            Practice by Category
          </Link>
        </div>
      </div>

      <CommunityBrowser initialData={initialData} />
    </main>
  );
}
