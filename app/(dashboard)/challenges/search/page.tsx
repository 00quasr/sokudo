import { searchChallenges, getCategories } from '@/lib/db/queries';
import { ChallengeSearch } from './challenge-search';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ChallengeSearchPage() {
  const [result, categoriesList] = await Promise.all([
    searchChallenges({ page: 1, limit: 20, sortBy: 'timesCompleted', sortOrder: 'desc' }),
    getCategories(),
  ]);

  const initialData = {
    ...result,
    categories: categoriesList.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
    })),
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Browse Challenges
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Search and filter challenges by category, difficulty, and popularity
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/practice"
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            Practice by Category
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/challenges/community"
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            Community Challenges
          </Link>
        </div>
      </div>

      <ChallengeSearch initialData={initialData} />
    </main>
  );
}
