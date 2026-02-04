import { Suspense } from 'react';
import { RaceLobby } from './race-lobby';
import { getUser } from '@/lib/db/queries';

export default async function RacePage() {
  const user = await getUser();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Multiplayer Race
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Compete against other developers in real-time typing races
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading races...</div>
          </div>
        }
      >
        <RaceLobby
          userId={user?.id}
          userName={user?.name ?? user?.email?.split('@')[0]}
        />
      </Suspense>
    </main>
  );
}
