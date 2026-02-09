'use client';

import { useState, useEffect } from 'react';
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

interface ChallengeFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function ChallengeFriendDialog({
  open,
  onOpenChange,
  onSent,
}: ChallengeFriendDialogProps) {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  useEffect(() => {
    if (!open) {
      setUsername('');
      setMessage('');
      setSelectedCategoryId(null);
      setSelectedChallengeId(null);
      setError(null);
      setSuccess(false);
      return;
    }
    setLoadingCategories(true);
    fetch('/api/categories?includeProgress=false')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setLoadingCategories(false);
      })
      .catch(() => setLoadingCategories(false));
  }, [open]);

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

  function pickRandomChallenge() {
    if (challenges.length === 0) return;
    const randomIdx = Math.floor(Math.random() * challenges.length);
    setSelectedChallengeId(challenges[randomIdx].id);
  }

  async function handleSend() {
    if (!selectedChallengeId || !username.trim()) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/friend-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengedUsername: username.trim(),
          challengeId: selectedChallengeId,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to send challenge');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSent();
        onOpenChange(false);
      }, 1500);
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#111113] border border-white/[0.08] p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-medium text-white">Challenge a Friend</h2>

        {success ? (
          <div className="py-8 text-center">
            <p className="text-lg font-medium text-green-400">Challenge sent!</p>
            <p className="mt-1 text-sm text-white/50">
              Waiting for {username} to accept...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Username input */}
            <div>
              <Label htmlFor="username" className="text-white/70">Opponent Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 rounded-xl border-white/[0.08] bg-white/[0.02] text-white placeholder:text-white/30 focus:border-white/20"
              />
            </div>

            {/* Optional message */}
            <div>
              <Label htmlFor="message" className="text-white/70">Message (optional)</Label>
              <Input
                id="message"
                placeholder="Think you can beat me?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={255}
                className="mt-2 rounded-xl border-white/[0.08] bg-white/[0.02] text-white placeholder:text-white/30 focus:border-white/20"
              />
            </div>

            {/* Category selection */}
            <div>
              <Label htmlFor="fc-category" className="text-white/70">Category</Label>
              {loadingCategories ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <select
                  id="fc-category"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  value={selectedCategoryId ?? ''}
                  onChange={(e) =>
                    setSelectedCategoryId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="" className="bg-[#111113]">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#111113]">
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
                  <Label htmlFor="fc-challenge" className="text-white/70">Challenge</Label>
                  {challenges.length > 0 && (
                    <button
                      type="button"
                      onClick={pickRandomChallenge}
                      className="text-xs font-medium text-white/60 hover:text-white"
                    >
                      Random
                    </button>
                  )}
                </div>
                {loadingChallenges ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading challenges...
                  </div>
                ) : (
                  <select
                    id="fc-challenge"
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    value={selectedChallengeId ?? ''}
                    onChange={(e) =>
                      setSelectedChallengeId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="" className="bg-[#111113]">Select a challenge</option>
                    {challenges.map((ch) => (
                      <option key={ch.id} value={ch.id} className="bg-[#111113]">
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
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/50">
                  <span className="capitalize">{selectedChallenge.syntaxType}</span>
                  <span className="capitalize">{selectedChallenge.difficulty}</span>
                </div>
                <code className="block whitespace-pre-wrap text-sm text-white/70 font-mono">
                  {selectedChallenge.content}
                </code>
              </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !selectedChallengeId || !username.trim()}
                className="rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Challenge
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
