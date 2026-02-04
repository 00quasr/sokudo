import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { oauthClients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  createAuthorizationCode,
  validateScopes,
} from '@/lib/auth/oauth';

const authorizeQuerySchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['plain', 'S256']).optional(),
});

/**
 * GET /api/oauth/authorize
 *
 * Validates authorization request parameters and returns client info
 * for the consent page to display. The consent page calls POST to approve.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, {
      prefix: 'oauth-authorize',
      limit: 30,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      // Redirect to sign-in, preserving the full authorize URL
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set(
        'redirect',
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(signInUrl.toString(), 302);
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = authorizeQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing or invalid parameters',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { client_id, redirect_uri, scope } = parsed.data;

    // Validate client exists and is active
    const [client] = await db
      .select({
        id: oauthClients.id,
        clientId: oauthClients.clientId,
        name: oauthClients.name,
        redirectUris: oauthClients.redirectUris,
        scopes: oauthClients.scopes,
      })
      .from(oauthClients)
      .where(
        and(eq(oauthClients.clientId, client_id), eq(oauthClients.active, true))
      )
      .limit(1);

    if (!client) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Unknown or inactive client',
        },
        { status: 400 }
      );
    }

    // Validate redirect URI
    const allowedUris = client.redirectUris as string[];
    if (!allowedUris.includes(redirect_uri)) {
      return NextResponse.json(
        {
          error: 'invalid_redirect_uri',
          error_description: 'Redirect URI not registered for this client',
        },
        { status: 400 }
      );
    }

    // Validate scopes
    const requestedScopes = scope ? scope.split(' ').filter(Boolean) : ['read'];
    if (!validateScopes(requestedScopes)) {
      return NextResponse.json(
        {
          error: 'invalid_scope',
          error_description: 'One or more requested scopes are invalid',
        },
        { status: 400 }
      );
    }

    // Return client info for the consent page
    return NextResponse.json({
      client: {
        name: client.name,
        clientId: client.clientId,
      },
      requestedScopes,
      redirectUri: redirect_uri,
    });
  } catch (error) {
    console.error('Error in GET /api/oauth/authorize:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

const approveSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['plain', 'S256']).optional(),
});

/**
 * POST /api/oauth/authorize
 *
 * Called when the user approves the consent. Creates an authorization code
 * and returns the redirect URL with the code.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, {
      prefix: 'oauth-authorize-approve',
      limit: 30,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    } = parsed.data;

    // Validate client and redirect URI
    const [client] = await db
      .select({
        id: oauthClients.id,
        clientId: oauthClients.clientId,
        redirectUris: oauthClients.redirectUris,
      })
      .from(oauthClients)
      .where(
        and(eq(oauthClients.clientId, client_id), eq(oauthClients.active, true))
      )
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: 'invalid_client' },
        { status: 400 }
      );
    }

    const allowedUris = client.redirectUris as string[];
    if (!allowedUris.includes(redirect_uri)) {
      return NextResponse.json(
        { error: 'invalid_redirect_uri' },
        { status: 400 }
      );
    }

    const requestedScopes = scope ? scope.split(' ').filter(Boolean) : ['read'];
    if (!validateScopes(requestedScopes)) {
      return NextResponse.json(
        { error: 'invalid_scope' },
        { status: 400 }
      );
    }

    // Create authorization code
    const code = await createAuthorizationCode({
      clientDbId: client.id,
      userId: user.id,
      redirectUri: redirect_uri,
      scopes: requestedScopes,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    });

    // Build redirect URL
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.json({ redirectUrl: redirectUrl.toString() });
  } catch (error) {
    console.error('Error in POST /api/oauth/authorize:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
