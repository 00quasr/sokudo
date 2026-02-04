import { notFound } from 'next/navigation';
import { SessionReplay } from '@/components/replay/SessionReplay';
import { getSessionWithKeystrokeLogs } from '@/lib/db/queries';

interface ReplayPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ReplayPage({ params }: ReplayPageProps) {
  const resolvedParams = await params;
  const sessionId = parseInt(resolvedParams.sessionId, 10);

  if (isNaN(sessionId) || sessionId <= 0) {
    notFound();
  }

  const session = await getSessionWithKeystrokeLogs(sessionId);

  if (!session) {
    notFound();
  }

  // Check if session has keystroke logs for replay
  if (session.keystrokeLogs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-xl font-medium mb-2">Replay Not Available</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This session was recorded before keystroke logging was enabled.
          Newer sessions will have full replay capability.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <SessionReplay session={session} />
    </div>
  );
}
