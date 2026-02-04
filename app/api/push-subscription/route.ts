import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import {
  saveSubscription,
  removeSubscription,
  hasSubscription,
} from '@/lib/notifications/push';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'push-subscription' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscribed = await hasSubscription(user.id);
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;

    return NextResponse.json({
      subscribed,
      vapidPublicKey,
    });
  } catch (error) {
    console.error('Get push subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'push-subscription', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid subscription', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await saveSubscription(user.id, parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'push-subscription', limit: 30 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    await removeSubscription(user.id, parsed.data.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
