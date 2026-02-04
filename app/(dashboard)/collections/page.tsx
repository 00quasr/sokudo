import { getPublicCollections } from '@/lib/db/queries';
import { CollectionBrowser } from './collection-browser';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const initialData = await getPublicCollections({ page: 1, limit: 20 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Challenge Collections
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Browse curated collections of typing challenges
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/challenges/community"
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            Browse Community Challenges
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/challenges/search"
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            Browse Built-in Challenges
          </Link>
        </div>
      </div>

      <CollectionBrowser initialData={initialData} />
    </main>
  );
}
