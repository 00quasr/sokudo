'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Plus,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Play,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, apiFetcher } from '@/lib/api-client';

type ConnectedRepo = {
  id: number;
  repoUrl: string;
  owner: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  lastScannedAt: string | null;
  scanStatus: 'pending' | 'scanning' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ScanStatusBadge({ status }: { status: ConnectedRepo['scanStatus'] }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    case 'scanning':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Scanning
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>
      );
  }
}

function RepoCard({
  repo,
  onDelete,
  onScan,
}: {
  repo: ConnectedRepo;
  onDelete: (id: number) => void;
  onScan: (id: number) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/repos/${repo.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(repo.id);
      }
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  }

  async function handleScan() {
    setIsScanning(true);
    try {
      await apiFetch(`/api/repos/${repo.id}/scan`, { method: 'POST' });
      onScan(repo.id);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="group rounded-xl bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
            <GitBranch className="h-5 w-5 text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">
              {repo.owner}/{repo.name}
            </h3>
            <p className="text-xs text-white/40">{repo.defaultBranch}</p>
          </div>
        </div>
        <ScanStatusBadge status={repo.scanStatus} />
      </div>

      {repo.description && (
        <p className="text-sm text-white/50 mb-3 line-clamp-2">{repo.description}</p>
      )}

      {repo.errorMessage && repo.scanStatus === 'failed' && (
        <p className="text-xs text-red-400 mb-3">{repo.errorMessage}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          Last scanned: {formatDate(repo.lastScannedAt)}
        </p>

        <div className="flex items-center gap-2">
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          {repo.scanStatus === 'completed' ? (
            <Link href={`/dashboard/repos/${repo.id}`}>
              <Button
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-0"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={handleScan}
              disabled={isScanning || repo.scanStatus === 'scanning'}
              className="bg-white/10 hover:bg-white/20 text-white border-0"
            >
              {isScanning || repo.scanStatus === 'scanning' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Scan
                </>
              )}
            </Button>
          )}

          {showConfirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConfirmDelete(true)}
              className="text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReposPage() {
  const { data, mutate } = useSWR<{ repos: ConnectedRepo[] }>('/api/repos', apiFetcher);
  const repos = data?.repos ?? [];

  function handleDelete(id: number) {
    mutate(
      { repos: repos.filter((r) => r.id !== id) },
      { revalidate: true }
    );
  }

  function handleScan() {
    mutate();
  }

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-medium text-white">GitHub Repos</h1>
          <p className="text-sm text-white/50 mt-1">
            Import commands from your repositories
          </p>
        </div>
        <Link href="/dashboard/repos/connect">
          <Button className="bg-white text-black hover:bg-white/90">
            <Plus className="h-4 w-4 mr-1.5" />
            Connect Repo
          </Button>
        </Link>
      </div>

      {repos.length === 0 ? (
        <div className="rounded-xl bg-white/[0.02] p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
            <GitBranch className="h-6 w-6 text-white/50" />
          </div>
          <h3 className="text-base font-medium text-white mb-2">
            No repositories connected
          </h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">
            Connect a GitHub repository to extract commands and generate personalized typing challenges.
          </p>
          <Link href="/dashboard/repos/connect">
            <Button className="bg-white text-black hover:bg-white/90">
              <Plus className="h-4 w-4 mr-1.5" />
              Connect Your First Repo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onDelete={handleDelete}
              onScan={handleScan}
            />
          ))}
        </div>
      )}
    </div>
  );
}
