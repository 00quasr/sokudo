import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { apiKeys } from '@/lib/db/schema';
import { authenticateApiKey, hasScope, generateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const createKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.enum(['read', 'write', '*'])).min(1).default(['read']),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:keys:get', limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error in GET /api/v1/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:keys:post', limit: 5, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    if (!hasScope(user, 'write') && !hasScope(user, '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires "write" scope.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = createKeySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, scopes, expiresInDays } = result.data;
    const { key, hash, prefix } = generateApiKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000)
      : null;

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes,
        expiresAt,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      });

    return NextResponse.json(
      {
        ...created,
        key, // Only returned once at creation time
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/v1/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = apiRateLimit(request, { prefix: 'v1:keys:delete', limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    if (!hasScope(user, 'write') && !hasScope(user, '*')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Requires "write" scope.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyIdParam = searchParams.get('keyId');

    if (!keyIdParam) {
      return NextResponse.json(
        { error: 'Missing required query parameter: keyId' },
        { status: 400 }
      );
    }

    const keyId = parseInt(keyIdParam, 10);
    if (isNaN(keyId) || keyId <= 0) {
      return NextResponse.json(
        { error: 'Invalid keyId parameter' },
        { status: 400 }
      );
    }

    // Ensure the key belongs to this user and is not already revoked
    const [existingKey] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.userId, user.id),
          isNull(apiKeys.revokedAt)
        )
      )
      .limit(1);

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/v1/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
