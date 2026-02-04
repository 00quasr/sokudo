import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { oauthClients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import { generateClientCredentials, VALID_OAUTH_SCOPES } from '@/lib/auth/oauth';

const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  redirectUris: z.array(z.string().url()).min(1).max(10),
  scopes: z.array(z.enum(['read', 'write'])).min(1).optional(),
});

/**
 * GET /api/oauth/clients
 *
 * List all OAuth clients owned by the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'oauth-clients' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await db
      .select({
        id: oauthClients.id,
        clientId: oauthClients.clientId,
        name: oauthClients.name,
        redirectUris: oauthClients.redirectUris,
        scopes: oauthClients.scopes,
        active: oauthClients.active,
        createdAt: oauthClients.createdAt,
        updatedAt: oauthClients.updatedAt,
      })
      .from(oauthClients)
      .where(eq(oauthClients.userId, user.id))
      .orderBy(desc(oauthClients.createdAt));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error in GET /api/oauth/clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/oauth/clients
 *
 * Register a new OAuth client application.
 * Returns the client_id and client_secret (secret is only shown once).
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'oauth-clients-create', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, redirectUris, scopes } = parsed.data;
    const { clientId, clientSecret, clientSecretHash } = generateClientCredentials();

    const [created] = await db
      .insert(oauthClients)
      .values({
        userId: user.id,
        clientId,
        clientSecretHash,
        name,
        redirectUris,
        scopes: scopes ?? ['read'],
      })
      .returning({
        id: oauthClients.id,
        clientId: oauthClients.clientId,
        name: oauthClients.name,
        redirectUris: oauthClients.redirectUris,
        scopes: oauthClients.scopes,
        createdAt: oauthClients.createdAt,
      });

    return NextResponse.json(
      {
        ...created,
        clientSecret, // Only returned once at creation time
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/oauth/clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
