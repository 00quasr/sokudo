'use client';

import { useState } from 'react';
import { GitFork, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActionState } from 'react';
import { forkChallenge } from '@/app/(dashboard)/dashboard/challenges/actions';
import type { ActionState } from '@/lib/auth/middleware';

interface ForkButtonProps {
  challengeId: number;
  variant?: 'default' | 'compact';
}

export function ForkButton({ challengeId, variant = 'default' }: ForkButtonProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    forkChallenge,
    {}
  );

  const isForked = !!state.success;

  if (variant === 'compact') {
    return (
      <form action={formAction}>
        <input type="hidden" name="challengeId" value={challengeId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className={`h-7 px-1.5 ${isForked ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
          disabled={isPending || isForked}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isForked ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <GitFork className="h-3.5 w-3.5" />
          )}
          <span className="ml-1 text-xs">
            {isPending ? 'Forking...' : isForked ? 'Forked' : 'Fork'}
          </span>
        </Button>
        {state.error && (
          <span className="text-xs text-red-500 ml-1">{state.error}</span>
        )}
      </form>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="challengeId" value={challengeId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className={isForked ? 'text-orange-500 border-orange-300' : ''}
        disabled={isPending || isForked}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Forking...
          </>
        ) : isForked ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Forked
          </>
        ) : (
          <>
            <GitFork className="mr-1.5 h-4 w-4" />
            Fork
          </>
        )}
      </Button>
      {state.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </form>
  );
}
