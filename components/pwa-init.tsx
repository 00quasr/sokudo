'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/notifications/client';

export function PWAInit() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker().catch((error) => {
        console.error('Failed to register service worker:', error);
      });
    }
  }, []);

  return null;
}
