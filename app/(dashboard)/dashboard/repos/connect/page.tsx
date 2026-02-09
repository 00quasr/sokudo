'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GitBranch, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';

export default function ConnectRepoPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      const res = await apiFetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to connect repository');
        return;
      }

      const data = await res.json();

      // Start scanning immediately
      await apiFetch(`/api/repos/${data.repo.id}/scan`, { method: 'POST' });

      // Redirect to the repo details page
      router.push(`/dashboard/repos/${data.repo.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="max-w-[600px]">
      <Link
        href="/dashboard/repos"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to repos
      </Link>

      <div className="rounded-xl bg-white/[0.02] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
            <GitBranch className="h-6 w-6 text-white/60" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">Connect Repository</h1>
            <p className="text-sm text-white/50">
              Import commands from a GitHub repository
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium text-white/70 mb-2">
              Repository URL
            </label>
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              required
            />
            <p className="text-xs text-white/40 mt-2">
              Currently supports public repositories only.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isConnecting || !url.trim()}
              className="bg-white text-black hover:bg-white/90"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect & Scan'
              )}
            </Button>
            <Link href="/dashboard/repos">
              <Button
                type="button"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <h3 className="text-sm font-medium text-white/70 mb-3">
            What we scan for
          </h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              package.json scripts (npm, yarn, pnpm)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              Makefile targets and commands
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              Dockerfile RUN instructions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              GitHub Actions workflow commands
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              README.md code blocks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
