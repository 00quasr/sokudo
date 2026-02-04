import { Suspense } from 'react';
import { RaceRoom } from './race-room';
import { SpectatorView } from '@/components/race/SpectatorView';
import { getUser } from '@/lib/db/queries';

export default async function RaceRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ raceId: string }>;
  searchParams: Promise<{ spectate?: string }>;
}) {
  const { raceId } = await params;
  const { spectate } = await searchParams;
  const user = await getUser();
  const isSpectating = spectate === 'true';

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading race...</div>
          </div>
        }
      >
        {isSpectating ? (
          <SpectatorView raceId={raceId} />
        ) : (
          <RaceRoom
            raceId={raceId}
            userId={user?.id}
            userName={user?.name ?? user?.email?.split('@')[0]}
          />
        )}
      </Suspense>
    </main>
  );
}
