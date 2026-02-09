'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Check, Copy } from 'lucide-react';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';
import type { BadgeType, BadgeStyle } from '@/lib/badges/svg';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const BADGE_TYPES: { type: BadgeType; label: string; description: string }[] = [
  { type: 'wpm', label: 'Average WPM', description: 'Your average typing speed' },
  { type: 'best-wpm', label: 'Best WPM', description: 'Your personal best typing speed' },
  { type: 'accuracy', label: 'Accuracy', description: 'Your average typing accuracy' },
  { type: 'streak', label: 'Streak', description: 'Your current practice streak' },
  { type: 'sessions', label: 'Sessions', description: 'Total completed sessions' },
];

const BADGE_STYLES: { style: BadgeStyle; label: string }[] = [
  { style: 'flat', label: 'Flat' },
  { style: 'flat-square', label: 'Flat Square' },
];

export default function BadgesPage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [selectedStyle, setSelectedStyle] = useState<BadgeStyle>('flat');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const username = user?.username;

  function getBadgeUrl(type: BadgeType): string {
    return `${baseUrl}/api/badges/${username}?type=${type}&style=${selectedStyle}`;
  }

  function getMarkdown(type: BadgeType): string {
    const badgeUrl = getBadgeUrl(type);
    const profileUrl = `${baseUrl}/u/${username}`;
    return `[![Sokudo ${type}](${badgeUrl})](${profileUrl})`;
  }

  function getHtml(type: BadgeType): string {
    const badgeUrl = getBadgeUrl(type);
    const profileUrl = `${baseUrl}/u/${username}`;
    return `<a href="${profileUrl}"><img src="${badgeUrl}" alt="Sokudo ${type}" /></a>`;
  }

  async function handleCopy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silent fallback
    }
  }

  if (!user) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
          README Badges
        </h1>
        <p className="text-sm text-white/50">Loading...</p>
      </section>
    );
  }

  if (!username) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
          README Badges
        </h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-white/50">
              Set a username in your{' '}
              <a href="/dashboard/general" className="text-orange-500 hover:underline">
                General settings
              </a>{' '}
              to generate badges for your GitHub README.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-white mb-6">
        README Badges
      </h1>

      <p className="text-sm text-white/50 mb-6">
        Add dynamic typing stats badges to your GitHub README or any markdown file.
        Badges update automatically as you practice.
      </p>

      {/* Style selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Badge Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {BADGE_STYLES.map(({ style, label }) => (
              <Button
                key={style}
                variant={selectedStyle === style ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStyle(style)}
                className={selectedStyle === style ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All badges combined snippet */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className="h-5 w-5 text-orange-500" />
            All Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BADGE_TYPES.map(({ type }) => (
              <img
                key={type}
                src={getBadgeUrl(type)}
                alt={`Sokudo ${type} badge`}
              />
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/50 font-medium">Markdown</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() =>
                  handleCopy(
                    BADGE_TYPES.map(({ type }) => getMarkdown(type)).join('\n'),
                    'all-md'
                  )
                }
              >
                {copiedId === 'all-md' ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {copiedId === 'all-md' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-white/[0.03] border border-white/[0.06] rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {BADGE_TYPES.map(({ type }) => getMarkdown(type)).join('\n')}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Individual badges */}
      {BADGE_TYPES.map(({ type, label, description }) => (
        <Card key={type} className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
            <p className="text-xs text-white/50">{description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Preview */}
            <div>
              <img
                src={getBadgeUrl(type)}
                alt={`Sokudo ${type} badge`}
              />
            </div>

            {/* Markdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50 font-medium">Markdown</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleCopy(getMarkdown(type), `${type}-md`)}
                >
                  {copiedId === `${type}-md` ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copiedId === `${type}-md` ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="bg-white/[0.03] border border-white/[0.06] rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {getMarkdown(type)}
              </pre>
            </div>

            {/* HTML */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50 font-medium">HTML</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleCopy(getHtml(type), `${type}-html`)}
                >
                  {copiedId === `${type}-html` ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copiedId === `${type}-html` ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="bg-white/[0.03] border border-white/[0.06] rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {getHtml(type)}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
