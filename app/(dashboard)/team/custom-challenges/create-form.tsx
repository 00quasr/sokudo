'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
const SYNTAX_OPTIONS = [
  'plain',
  'bash',
  'git',
  'shell',
  'react',
  'typescript',
  'docker',
  'sql',
  'npm',
  'yarn',
  'pnpm',
] as const;

export function CreateTeamCustomChallengeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const difficulty = formData.get('difficulty') as string;
    const syntaxType = formData.get('syntaxType') as string;
    const hint = formData.get('hint') as string;

    try {
      const res = await fetch('/api/team/custom-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          content,
          difficulty: difficulty || undefined,
          syntaxType: syntaxType || undefined,
          hint: hint || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create challenge');
        return;
      }

      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch {
      setError('Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Docker Compose Multi-Service"
          required
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content (what to type)</Label>
        <textarea
          id="content"
          name="content"
          placeholder="docker compose -f docker-compose.prod.yml up -d --build"
          required
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="syntaxType">Syntax Type</Label>
          <select
            id="syntaxType"
            name="syntaxType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {SYNTAX_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hint">Hint (optional)</Label>
        <Input
          id="hint"
          name="hint"
          placeholder="Any tips for this challenge..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Challenge'}
      </Button>
    </form>
  );
}
