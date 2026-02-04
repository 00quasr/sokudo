import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { apiKeys } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'keys:delete', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = await params;
    const keyIdNum = parseInt(keyId, 10);
    if (isNaN(keyIdNum) || keyIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    const [existingKey] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyIdNum),
          eq(apiKeys.userId, user.id),
          isNull(apiKeys.revokedAt)
        )
      )
      .limit(1);

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyIdNum));

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/keys/[keyId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
