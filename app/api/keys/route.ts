import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { apiKeys } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { generateApiKey } from '@/lib/auth/api-key';
import { apiRateLimit } from '@/lib/rate-limit';

const createKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.enum(['read', 'write', '*'])).min(1),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'keys' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Error in GET /api/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'keys', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Error in POST /api/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
