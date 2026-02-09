'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { removeChallengeFromCollection } from '../actions';
import type { ActionState } from '@/lib/auth/middleware';

export function RemoveChallengeButton({
  collectionId,
  challengeId,
}: {
  collectionId: number;
  challengeId: number;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    removeChallengeFromCollection,
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="collectionId" value={collectionId} />
      <input type="hidden" name="challengeId" value={challengeId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
