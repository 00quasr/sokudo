'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  challengeCount: number;
}

interface Challenge {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
}

interface CreateRaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateRaceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateRaceDialogProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(
    null
  );
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Fetch categories when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    fetch('/api/categories?includeProgress=false')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setLoadingCategories(false);
      })
      .catch(() => setLoadingCategories(false));
  }, [open]);

  // Fetch challenges when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setChallenges([]);
      setSelectedChallengeId(null);
      return;
    }
    setLoadingChallenges(true);
    setSelectedChallengeId(null);
    fetch(`/api/challenges?categoryId=${selectedCategoryId}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges ?? []);
        setLoadingChallenges(false);
      })
      .catch(() => setLoadingChallenges(false));
  }, [selectedCategoryId]);

  // Pick a random challenge from the selected category
  function pickRandomChallenge() {
    if (challenges.length === 0) return;
    const randomIdx = Math.floor(Math.random() * challenges.length);
    setSelectedChallengeId(challenges[randomIdx].id);
  }

  async function handleCreate() {
    if (!selectedChallengeId) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: selectedChallengeId,
          maxPlayers,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to create race');
        return;
      }

      const created = await res.json();
      onCreated();
      router.push(`/race/${created.id}`);
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  const selectedChallenge = challenges.find(
    (c) => c.id === selectedChallengeId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Create a Race</h2>

        <div className="space-y-4">
          {/* Category selection */}
          <div>
            <Label htmlFor="category">Category</Label>
            {loadingCategories ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <select
                id="category"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={selectedCategoryId ?? ''}
                onChange={(e) =>
                  setSelectedCategoryId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.challengeCount} challenges)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Challenge selection */}
          {selectedCategoryId && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="challenge">Challenge</Label>
                {challenges.length > 0 && (
                  <button
                    type="button"
                    onClick={pickRandomChallenge}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    Random
                  </button>
                )}
              </div>
              {loadingChallenges ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading challenges...
                </div>
              ) : (
                <select
                  id="challenge"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={selectedChallengeId ?? ''}
                  onChange={(e) =>
                    setSelectedChallengeId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Select a challenge</option>
                  {challenges.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.content.slice(0, 50)}
                      {ch.content.length > 50 ? '...' : ''} ({ch.difficulty})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Challenge preview */}
          {selectedChallenge && (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="capitalize">
                  {selectedChallenge.syntaxType}
                </span>
                <span className="capitalize">
                  {selectedChallenge.difficulty}
                </span>
              </div>
              <code className="block whitespace-pre-wrap text-sm text-gray-700">
                {selectedChallenge.content}
              </code>
            </div>
          )}

          {/* Max players */}
          <div>
            <Label htmlFor="maxPlayers">Max Players</Label>
            <Input
              id="maxPlayers"
              type="number"
              min={2}
              max={8}
              value={maxPlayers}
              onChange={(e) =>
                setMaxPlayers(
                  Math.max(2, Math.min(8, parseInt(e.target.value, 10) || 2))
                )
              }
              className="mt-1"
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !selectedChallengeId}
              className="rounded-full"
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Race
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
