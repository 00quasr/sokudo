'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/notifications/client';

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = isPushSupported();
      setSupported(isSupported);

      if (!isSupported) {
        setLoading(false);
        return;
      }

      setPermission(getPermissionState());

      const existing = await getCurrentSubscription();
      if (existing) {
        // Verify server-side too
        try {
          const res = await fetch('/api/push-subscription');
          if (res.ok) {
            const data = await res.json();
            setSubscribed(data.subscribed);
          }
        } catch {
          // Fall back to local state
          setSubscribed(true);
        }
      } else {
        setSubscribed(false);
      }

      setLoading(false);
    };

    checkStatus();
  }, []);

  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get VAPID key from server
      const res = await fetch('/api/push-subscription');
      if (!res.ok) {
        throw new Error('Failed to get VAPID key');
      }
      const { vapidPublicKey } = await res.json();
      if (!vapidPublicKey) {
        setError('Push notifications are not configured on this server.');
        setLoading(false);
        return;
      }

      const subscription = await subscribeToPush(vapidPublicKey);
      if (!subscription) {
        const currentPermission = getPermissionState();
        setPermission(currentPermission);
        if (currentPermission === 'denied') {
          setError('Notification permission was denied. Please enable it in your browser settings.');
        } else {
          setError('Failed to subscribe to push notifications.');
        }
        setLoading(false);
        return;
      }

      // Send subscription to server
      const subJson = subscription.toJSON();
      const saveRes = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save subscription');
      }

      // Update preferences
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushNotificationsEnabled: true }),
      });

      setSubscribed(true);
      setPermission('granted');
    } catch {
      setError('Failed to enable push notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentSub = await getCurrentSubscription();
      if (currentSub) {
        const subJson = currentSub.toJSON();

        // Remove from server
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subJson.endpoint }),
        });
      }

      await unsubscribeFromPush();

      // Update preferences
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushNotificationsEnabled: false }),
      });

      setSubscribed(false);
    } catch {
      setError('Failed to disable push notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!supported) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Push notifications are not supported in this browser.</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>
          Notifications are blocked. Enable them in your browser settings to
          receive streak reminders.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {subscribed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnsubscribe}
            disabled={loading}
            data-testid="push-unsubscribe-btn"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            Disable Push Notifications
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubscribe}
            disabled={loading}
            data-testid="push-subscribe-btn"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Enable Push Notifications
          </Button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {subscribed && !loading && (
        <p className="text-xs text-muted-foreground">
          You&apos;ll receive browser notifications when your streak is at risk.
        </p>
      )}
    </div>
  );
}
