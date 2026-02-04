'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { addChallengeToCollection } from '../actions';
import type { ActionState } from '@/lib/auth/middleware';

export function AddChallengeForm({ collectionId }: { collectionId: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addChallengeToCollection,
    {}
  );

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="collectionId" value={collectionId} />
      <div className="flex-1">
        <label htmlFor="challengeId" className="text-sm font-medium text-gray-700 mb-1 block">
          Add Challenge by ID
        </label>
        <Input
          id="challengeId"
          name="challengeId"
          type="number"
          min={1}
          required
          placeholder="Enter challenge ID"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Plus className="h-4 w-4 mr-1" />
        )}
        Add
      </Button>
      {state.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
      {state.success && (
        <p className="text-green-500 text-sm">{state.success}</p>
      )}
    </form>
  );
}
