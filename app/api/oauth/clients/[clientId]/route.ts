import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { oauthClients, oauthAccessTokens } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * DELETE /api/oauth/clients/[clientId]
 *
 * Deactivate an OAuth client owned by the authenticated user.
 * This revokes the client and all associated tokens (via CASCADE).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'oauth-clients-delete', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await params;
    const id = parseInt(clientId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const [client] = await db
      .select({ id: oauthClients.id })
      .from(oauthClients)
      .where(
        and(
          eq(oauthClients.id, id),
          eq(oauthClients.userId, user.id)
        )
      )
      .limit(1);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await db
      .update(oauthClients)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(oauthClients.id, id));

    // Revoke all access tokens for this client
    await db
      .update(oauthAccessTokens)
      .set({ revokedAt: new Date() })
      .where(eq(oauthAccessTokens.clientId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/oauth/clients/[clientId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
