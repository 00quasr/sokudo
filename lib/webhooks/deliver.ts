import { createHmac } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';

export type WebhookEventType = 'session.completed' | 'achievement.earned';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [0, 5_000, 30_000];
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Sign a webhook payload with HMAC-SHA256.
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Deliver a webhook event to a single endpoint.
 * Records the delivery result in the webhook_deliveries table.
 */
async function deliverToEndpoint(
  webhook: { id: number; url: string; secret: string },
  payload: WebhookPayload,
  attemptNumber: number
): Promise<boolean> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, webhook.secret);

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery-Timestamp': payload.timestamp,
        'User-Agent': 'Sokudo-Webhooks/1.0',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    responseBody = await response.text().catch(() => null);
    success = response.ok;
  } catch (error) {
    responseBody = error instanceof Error ? error.message : 'Unknown error';
  }

  // Record the delivery attempt
  await db.insert(webhookDeliveries).values({
    webhookId: webhook.id,
    event: payload.event,
    payload,
    statusCode,
    responseBody: responseBody?.slice(0, 2000) ?? null,
    success,
    attemptNumber,
  });

  // Update webhook lastDeliveredAt on success
  if (success) {
    await db
      .update(webhooks)
      .set({ lastDeliveredAt: new Date() })
      .where(eq(webhooks.id, webhook.id));
  }

  return success;
}

/**
 * Deliver a webhook event with retries.
 */
async function deliverWithRetries(
  webhook: { id: number; url: string; secret: string },
  payload: WebhookPayload
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const delay = RETRY_DELAYS_MS[attempt - 1] ?? 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const success = await deliverToEndpoint(webhook, payload, attempt);
    if (success) return;
  }

  // All retries exhausted — the delivery records are already saved
}

/**
 * Dispatch a webhook event to all registered endpoints for a user
 * that subscribe to the given event type. Runs in the background (fire-and-forget).
 */
export async function dispatchWebhookEvent(
  userId: number,
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Find all active webhooks for this user that subscribe to this event
  const userWebhooks = await db
    .select({
      id: webhooks.id,
      url: webhooks.url,
      secret: webhooks.secret,
      events: webhooks.events,
    })
    .from(webhooks)
    .where(and(eq(webhooks.userId, userId), eq(webhooks.active, true)));

  const matching = userWebhooks.filter((wh) => {
    const events = wh.events as string[];
    return events.includes(event);
  });

  if (matching.length === 0) return;

  // Deliver to all matching webhooks concurrently
  await Promise.allSettled(
    matching.map((wh) => deliverWithRetries(wh, payload))
  );
}
