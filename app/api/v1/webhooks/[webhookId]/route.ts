import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { authenticateApiKey, hasScope } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const WEBHOOK_EVENT_TYPES = ['session.completed', 'achievement.earned'] as const;

const webhookIdSchema = z.object({
  webhookId: z.coerce.number().int().positive(),
});

const updateWebhookSchema = z.object({
  url: z.string().url().max(2048).optional(),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1).optional(),
  active: z.boolean().optional(),
  description: z.string().max(255).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:webhooks:get-one' });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const resolvedParams = await params;
    const paramResult = webhookIdSchema.safeParse(resolvedParams);
    if (!paramResult.success) {
      return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
    }

    const [webhook] = await db
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
      .where(and(eq(webhooks.id, paramResult.data.webhookId), eq(webhooks.userId, user.id)))
      .limit(1);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const recentDeliveries = await db
      .select({
        id: webhookDeliveries.id,
        event: webhookDeliveries.event,
        statusCode: webhookDeliveries.statusCode,
        success: webhookDeliveries.success,
        attemptNumber: webhookDeliveries.attemptNumber,
        deliveredAt: webhookDeliveries.deliveredAt,
      })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhook.id))
      .orderBy(desc(webhookDeliveries.deliveredAt))
      .limit(20);

    return NextResponse.json({ ...webhook, recentDeliveries });
  } catch (error) {
    console.error('Error in GET /api/v1/webhooks/[webhookId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:webhooks:update', limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    if (!hasScope(user, 'write') && !hasScope(user, '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires "write" scope.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const paramResult = webhookIdSchema.safeParse(resolvedParams);
    if (!paramResult.success) {
      return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
    }

    const body = await request.json();
    const result = updateWebhookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: webhooks.id })
      .from(webhooks)
      .where(and(eq(webhooks.id, paramResult.data.webhookId), eq(webhooks.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.url !== undefined) updateData.url = result.data.url;
    if (result.data.events !== undefined) updateData.events = result.data.events;
    if (result.data.active !== undefined) updateData.active = result.data.active;
    if (result.data.description !== undefined) updateData.description = result.data.description;

    const [updated] = await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, paramResult.data.webhookId))
      .returning({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        description: webhooks.description,
        lastDeliveredAt: webhooks.lastDeliveredAt,
        createdAt: webhooks.createdAt,
        updatedAt: webhooks.updatedAt,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PATCH /api/v1/webhooks/[webhookId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:webhooks:delete', limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    if (!hasScope(user, 'write') && !hasScope(user, '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires "write" scope.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const paramResult = webhookIdSchema.safeParse(resolvedParams);
    if (!paramResult.success) {
      return NextResponse.json({ error: 'Invalid webhook ID' }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: webhooks.id })
      .from(webhooks)
      .where(and(eq(webhooks.id, paramResult.data.webhookId), eq(webhooks.userId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await db.delete(webhooks).where(eq(webhooks.id, paramResult.data.webhookId));

    return NextResponse.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/v1/webhooks/[webhookId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
