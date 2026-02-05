'use client';

import { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export function ScreenReaderAnnouncer({
  message,
  priority = 'polite',
  clearOnUnmount = true,
}: ScreenReaderAnnouncerProps) {
  const previousMessage = useRef<string>('');

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      previousMessage.current = message;
    }

    return () => {
      if (clearOnUnmount) {
        previousMessage.current = '';
      }
    };
  }, [message, clearOnUnmount]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

export function useScreenReaderAnnouncement() {
  const announcementRef = useRef<HTMLDivElement | null>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof document === 'undefined') return;

    const existingAnnouncer = document.getElementById('screen-reader-announcer');
    const announcer = existingAnnouncer || document.createElement('div');

    if (!existingAnnouncer) {
      announcer.id = 'screen-reader-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    } else {
      announcer.setAttribute('aria-live', priority);
    }

    announcementRef.current = announcer as HTMLDivElement;

    // Clear first to ensure announcement triggers even for repeated messages
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  };

  return { announce };
}
