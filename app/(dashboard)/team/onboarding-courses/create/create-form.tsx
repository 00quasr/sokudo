'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import type { Category } from '@/lib/db/schema';

interface Challenge {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
}

export function CreateOnboardingCourseForm({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState<number[]>([]);

  useEffect(() => {
    if (!selectedCategorySlug) {
      setChallenges([]);
      return;
    }

    setLoadingChallenges(true);
    fetch(`/api/challenges?categorySlug=${selectedCategorySlug}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setChallenges(data.challenges ?? []);
      })
      .catch(() => setChallenges([]))
      .finally(() => setLoadingChallenges(false));
  }, [selectedCategorySlug]);

  function addChallenge(id: number) {
    if (!selectedChallengeIds.includes(id)) {
      setSelectedChallengeIds((prev) => [...prev, id]);
    }
  }

  function removeChallenge(id: number) {
    setSelectedChallengeIds((prev) => prev.filter((cid) => cid !== id));
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    const newIds = [...selectedChallengeIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    setSelectedChallengeIds(newIds);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (selectedChallengeIds.length === 0) {
      setError('Please add at least one challenge step');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const res = await fetch('/api/team/onboarding-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          challengeIds: selectedChallengeIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create course');
        return;
      }

      router.push('/team/onboarding-courses');
      router.refresh();
    } catch {
      setError('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Build a lookup for selected challenges' info
  const challengeMap = new Map(challenges.map((c) => [c.id, c]));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Course Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Git Basics Onboarding"
          required
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Help new team members learn the essential git commands..."
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Challenge Selection */}
      <div className="space-y-3">
        <Label>Add Challenge Steps</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs text-muted-foreground">
              Filter by Category
            </Label>
            <select
              id="category"
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingChallenges && (
          <p className="text-sm text-muted-foreground">Loading challenges...</p>
        )}

        {challenges.length > 0 && (
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {challenges.map((challenge) => {
              const isSelected = selectedChallengeIds.includes(challenge.id);
              return (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => addChallenge(challenge.id)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 hover:bg-white/[0.03] ${
                    isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.1] text-white/60">
                      {challenge.difficulty}
                    </span>
                    <span className="font-mono text-xs truncate">
                      {challenge.content.slice(0, 60)}
                      {challenge.content.length > 60 ? '...' : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Steps */}
      {selectedChallengeIds.length > 0 && (
        <div className="space-y-2">
          <Label>Course Steps ({selectedChallengeIds.length})</Label>
          <div className="space-y-2">
            {selectedChallengeIds.map((id, index) => {
              const challenge = challengeMap.get(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 border rounded-md p-2"
                >
                  <span className="text-xs font-medium text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  <span className="font-mono text-xs flex-1 truncate">
                    {challenge
                      ? challenge.content.slice(0, 50)
                      : `Challenge #${id}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="text-xs text-muted-foreground hover:text-white disabled:opacity-30 px-1"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === selectedChallengeIds.length - 1}
                      className="text-xs text-muted-foreground hover:text-white disabled:opacity-30 px-1"
                    >
                      Dn
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChallenge(id)}
                      className="text-muted-foreground hover:text-red-600 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Course'}
      </Button>
    </form>
  );
}
