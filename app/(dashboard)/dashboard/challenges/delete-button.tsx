'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { deleteCustomChallenge } from './actions';
import type { ActionState } from '@/lib/auth/middleware';

export function DeleteChallengeButton({ challengeId }: { challengeId: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    deleteCustomChallenge,
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={challengeId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
      {state.error && (
        <p className="text-red-500 text-xs mt-1">{state.error}</p>
      )}
    </form>
  );
}
