'use client';

import { useState, useCallback } from 'react';
import { Lightbulb, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { AIHintResponse } from '@/lib/ai/generate-hints';
import { apiFetch } from '@/lib/api-client';

interface AIHintTipProps {
  challengeContent: string;
  syntaxType: string;
  difficulty: string;
  categoryName: string;
  existingHint?: string;
  userWpm?: number;
  userAccuracy?: number;
  weakKeys?: string[];
  commonTypos?: { expected: string; actual: string }[];
}

export function AIHintTip({
  challengeContent,
  syntaxType,
  difficulty,
  categoryName,
  existingHint,
  userWpm,
  userAccuracy,
  weakKeys,
  commonTypos,
}: AIHintTipProps) {
  const [hint, setHint] = useState<AIHintResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchHint = useCallback(async () => {
    if (hint || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/practice/hints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeContent,
          syntaxType,
          difficulty,
          categoryName,
          existingHint,
          userWpm,
          userAccuracy,
          weakKeys,
          commonTypos,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to generate hint');
      }

      const data = await response.json();
      setHint(data.hint);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hint');
    } finally {
      setLoading(false);
    }
  }, [
    hint,
    loading,
    challengeContent,
    syntaxType,
    difficulty,
    categoryName,
    existingHint,
    userWpm,
    userAccuracy,
    weakKeys,
    commonTypos,
  ]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <div className="flex items-center gap-2 text-sm text-red-400">
          <Lightbulb className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!hint && !loading) {
    return (
      <button
        onClick={fetchHint}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        data-testid="ai-hint-button"
      >
        <Sparkles className="h-4 w-4" />
        Get AI Tips
      </button>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        data-testid="ai-hint-loading"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Generating tips...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5" data-testid="ai-hint-content">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm"
      >
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">AI Tips</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && hint && (
        <div className="space-y-3 border-t border-purple-500/10 px-4 py-3">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-purple-400/70">
              <Lightbulb className="h-3 w-3" />
              Tip
            </div>
            <p className="text-sm text-foreground/90" data-testid="ai-hint-tip">
              {hint.tip}
            </p>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-purple-400/70">
              Explanation
            </div>
            <p className="text-sm text-foreground/70" data-testid="ai-hint-explanation">
              {hint.explanation}
            </p>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-purple-400/70">
              How to Improve
            </div>
            <p className="text-sm text-foreground/70" data-testid="ai-hint-improvement">
              {hint.improvementSuggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
