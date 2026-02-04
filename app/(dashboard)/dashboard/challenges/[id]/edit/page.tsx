import { getCustomChallengeById } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { EditChallengeForm } from './edit-form';

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challengeId = parseInt(id, 10);

  if (isNaN(challengeId)) {
    notFound();
  }

  const challenge = await getCustomChallengeById(challengeId);

  if (!challenge) {
    notFound();
  }

  return (
    <EditChallengeForm
      challenge={{
        id: challenge.id,
        name: challenge.name,
        content: challenge.content,
        isPublic: challenge.isPublic,
      }}
    />
  );
}
