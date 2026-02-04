import webpush from 'web-push';
import { db } from '@/lib/db/drizzle';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey };
}

function initWebPush() {
  const keys = getVapidKeys();
  if (!keys) {
    return false;
  }

  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'noreply@sokudo.dev'}`,
    keys.publicKey,
    keys.privateKey
  );

  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export async function saveSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const existing = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
}

export async function removeSubscription(
  userId: number,
  endpoint: string
): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function removeAllSubscriptions(userId: number): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function sendPushNotification(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!initWebPush()) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error) {
      failed++;
      // Remove invalid subscriptions (410 Gone or 404 Not Found)
      if (
        error instanceof webpush.WebPushError &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  return { sent, failed };
}

export async function hasSubscription(userId: number): Promise<boolean> {
  const result = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);

  return result.length > 0;
}
