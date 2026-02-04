'use client';

import { useState } from 'react';
import { Share2, Link2, Check, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareStatsCardProps {
  username: string;
  baseUrl: string;
}

export function ShareStatsCard({ username, baseUrl }: ShareStatsCardProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = `${baseUrl}/u/${username}`;
  const ogImageUrl = `${baseUrl}/api/og/stats/${username}`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my developer typing stats on Sokudo!\n\n${profileUrl}`
  )}`;

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    profileUrl
  )}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = profileUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleCopyImageUrl() {
    navigator.clipboard.writeText(ogImageUrl).catch(() => {
      // Silent fallback
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900">Share Your Stats</h3>
      </div>

      {/* Preview card */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogImageUrl}
          alt={`${username}'s Sokudo stats card`}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="h-4 w-4" />
            Share on X
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <a
            href={linkedinShareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyImageUrl}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          Copy Image URL
        </Button>
      </div>
    </div>
  );
}
