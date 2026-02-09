import { Suspense } from 'react';
import { RaceLobby } from './race-lobby';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function RacePage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in?redirect=/race');
  }

  return (
    <main className="min-h-screen bg-[#08090a]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-medium text-white">
            Multiplayer Race
          </h1>
          <p className="mt-4 text-lg text-white/50">
            Compete against other developers in real-time typing races
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-white/50">Loading races...</div>
            </div>
          }
        >
          <RaceLobby
            userId={user.id}
            userName={user.name ?? user.email?.split('@')[0]}
          />
        </Suspense>
      </div>
    </main>
  );
}
