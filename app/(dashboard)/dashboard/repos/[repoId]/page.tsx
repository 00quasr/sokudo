'use client';

import { useState, use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  GitBranch,
  Loader2,
  Sparkles,
  Check,
  X,
  FileCode,
  Terminal,
  Save,
  AlertCircle,
} from 'lucide-react';
import { apiFetch, apiFetcher } from '@/lib/api-client';

type ScannedCommand = {
  id: number;
  sourceFile: string;
  extractedCommand: string;
  commandType: string;
};

type GeneratedChallenge = {
  id: number;
  content: string;
  difficulty: string;
  syntaxType: string;
  hint: string;
  importance: number;
  isSelected: boolean;
};

type Repo = {
  id: number;
  owner: string;
  name: string;
  description: string | null;
  scanStatus: string;
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-red-500/20 text-red-400',
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${colors[difficulty as keyof typeof colors] || colors.beginner}`}
    >
      {difficulty}
    </span>
  );
}

function ChallengeCard({
  challenge,
  onToggle,
}: {
  challenge: GeneratedChallenge;
  onToggle: (id: number, isSelected: boolean) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggle() {
    setIsUpdating(true);
    await onToggle(challenge.id, !challenge.isSelected);
    setIsUpdating(false);
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        challenge.isSelected
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white/[0.01] border-white/[0.05] opacity-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <code className="text-sm text-white/90 font-mono break-all">
          {challenge.content}
        </code>
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`shrink-0 h-5 w-5 rounded flex items-center justify-center transition-colors ${
            challenge.isSelected
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-white/10 text-white/40 hover:bg-white/20'
          }`}
        >
          {isUpdating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : challenge.isSelected ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      </div>

      {challenge.hint && (
        <p className="text-xs text-white/50 mb-2">{challenge.hint}</p>
      )}

      <div className="flex items-center gap-2">
        <DifficultyBadge difficulty={challenge.difficulty} />
        <span className="text-xs text-white/30 px-2 py-0.5 rounded-full bg-white/[0.04]">
          {challenge.syntaxType}
        </span>
      </div>
    </div>
  );
}

export default function RepoDetailPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: repoData } = useSWR<{ repo: Repo }>(
    `/api/repos/${repoId}`,
    apiFetcher
  );
  const {
    data: commandsData,
    isLoading: commandsLoading,
  } = useSWR<{ commands: ScannedCommand[] }>(
    `/api/repos/${repoId}/commands`,
    apiFetcher
  );
  const {
    data: challengesData,
    mutate: mutateChallenges,
  } = useSWR<{ challenges: GeneratedChallenge[] }>(
    `/api/repos/${repoId}/generate`,
    apiFetcher
  );

  const repo = repoData?.repo;
  const commands = commandsData?.commands ?? [];
  const challenges = challengesData?.challenges ?? [];
  const selectedCount = challenges.filter((c) => c.isSelected).length;

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/repos/${repoId}/generate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate challenges');
        return;
      }
      mutateChallenges();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleChallenge(id: number, isSelected: boolean) {
    try {
      await apiFetch(`/api/repos/${repoId}/challenges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSelected }),
      });
      mutateChallenges();
    } catch {
      // Silently fail
    }
  }

  async function handleSaveCategory() {
    if (!categoryName.trim() || selectedCount === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/repos/${repoId}/save-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save category');
        return;
      }

      router.push('/dashboard/repos');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!repo) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <Link
        href="/dashboard/repos"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to repos
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
          <GitBranch className="h-6 w-6 text-white/60" />
        </div>
        <div>
          <h1 className="text-lg font-medium text-white">
            {repo.owner}/{repo.name}
          </h1>
          <p className="text-sm text-white/50">
            {commands.length} commands found
          </p>
        </div>
      </div>

      {/* Scanned Commands */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          Extracted Commands
        </h2>

        {commandsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
          </div>
        ) : commands.length === 0 ? (
          <div className="rounded-lg bg-white/[0.02] p-8 text-center">
            <Terminal className="h-8 w-8 text-white/30 mx-auto mb-3" />
            <p className="text-sm text-white/50">No commands found in this repository.</p>
          </div>
        ) : (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] divide-y divide-white/[0.06] max-h-64 overflow-y-auto">
            {commands.slice(0, 20).map((cmd) => (
              <div key={cmd.id} className="p-3 flex items-center gap-3">
                <span className="text-xs text-white/30 px-2 py-0.5 rounded bg-white/[0.04] shrink-0">
                  {cmd.commandType}
                </span>
                <code className="text-sm text-white/70 font-mono truncate">
                  {cmd.extractedCommand}
                </code>
                <span className="text-xs text-white/30 ml-auto shrink-0">
                  {cmd.sourceFile}
                </span>
              </div>
            ))}
            {commands.length > 20 && (
              <div className="p-3 text-center text-sm text-white/40">
                +{commands.length - 20} more commands
              </div>
            )}
          </div>
        )}
      </section>

      {/* Generate Challenges Button */}
      {commands.length > 0 && challenges.length === 0 && (
        <div className="mb-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-white text-black hover:bg-white/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Typing Challenges
              </>
            )}
          </Button>
          <p className="text-xs text-white/40 mt-2">
            AI will analyze commands and create typing challenges with hints
          </p>
        </div>
      )}

      {/* Generated Challenges */}
      {challenges.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generated Challenges ({selectedCount} selected)
            </h2>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Regenerate'
              )}
            </Button>
          </div>

          <div className="grid gap-3 mb-6">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onToggle={handleToggleChallenge}
              />
            ))}
          </div>

          {/* Save as Category */}
          <div className="rounded-lg bg-white/[0.03] border border-white/10 p-5">
            <h3 className="text-sm font-medium text-white mb-3">
              Save as Practice Category
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Category name (e.g., Next.js Workflows)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
              <Button
                onClick={handleSaveCategory}
                disabled={isSaving || !categoryName.trim() || selectedCount === 0}
                className="bg-white text-black hover:bg-white/90 shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {selectedCount === 0 && (
              <p className="text-xs text-yellow-400 mt-2">
                Select at least one challenge to save
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
