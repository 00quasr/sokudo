'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCollection } from './actions';
import type { ActionState } from '@/lib/auth/middleware';

export function DeleteCollectionButton({ collectionId }: { collectionId: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    deleteCollection,
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={collectionId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={(e) => {
          if (!confirm('Delete this collection? The challenges inside will not be deleted.')) {
            e.preventDefault();
          }
        }}
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
