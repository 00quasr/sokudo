'use client';

import { useState } from 'react';
import { Share2, Link2, Check, Twitter } from 'lucide-react';

interface ShareProgressButtonsProps {
  wpm: number;
  accuracy: number;
  categoryName?: string;
}

function buildShareText({ wpm, accuracy, categoryName }: ShareProgressButtonsProps): string {
  if (categoryName) {
    return `I just typed ${wpm} WPM with ${accuracy}% accuracy practicing ${categoryName} on Sokudo!\n\nPractice your developer typing at`;
  }
  return `I just typed ${wpm} WPM with ${accuracy}% accuracy on Sokudo!\n\nPractice your developer typing at`;
}

export function ShareProgressButtons({ wpm, accuracy, categoryName }: ShareProgressButtonsProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = buildShareText({ wpm, accuracy, categoryName });

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${shareText} ${baseUrl}`
  )}`;

  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    baseUrl
  )}`;

  async function handleCopyText() {
    const text = `${shareText} ${baseUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
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

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Share2 className="h-3 w-3" />
        Share
      </span>
      <button
        type="button"
        onClick={handleCopyText}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        aria-label={copied ? 'Copied to clipboard' : 'Copy result to clipboard'}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Link2 className="h-3 w-3" />
        )}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <a
        href={twitterShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        aria-label="Share on X (Twitter)"
      >
        <Twitter className="h-3 w-3" />
        X
      </a>
      <a
        href={linkedinShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-muted"
        aria-label="Share on LinkedIn"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>
    </div>
  );
}
