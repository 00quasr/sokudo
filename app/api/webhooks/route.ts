import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db/drizzle';
import { webhooks } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const WEBHOOK_EVENT_TYPES = ['session.completed', 'achievement.earned'] as const;

const createWebhookSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1),
  description: z.string().max(255).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'webhooks' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWebhooks = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        description: webhooks.description,
        lastDeliveredAt: webhooks.lastDeliveredAt,
        createdAt: webhooks.createdAt,
        updatedAt: webhooks.updatedAt,
      })
      .from(webhooks)
      .where(eq(webhooks.userId, user.id))
      .orderBy(desc(webhooks.createdAt));

    return NextResponse.json({ webhooks: userWebhooks });
  } catch (error) {
    console.error('Error in GET /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'webhooks:create', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createWebhookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { url, events, description } = result.data;
    const secret = `whsec_${randomBytes(24).toString('hex')}`;

    const [created] = await db
      .insert(webhooks)
      .values({
        userId: user.id,
        url,
        secret,
        events,
        description: description ?? null,
      })
      .returning({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        description: webhooks.description,
        createdAt: webhooks.createdAt,
      });

    return NextResponse.json(
      {
        ...created,
        secret, // Only returned once at creation time
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
