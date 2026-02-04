import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRateLimit } from '@/lib/rate-limit';
import { exchangeAuthorizationCode } from '@/lib/auth/oauth';

const tokenSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  redirect_uri: z.string().url(),
  code_verifier: z.string().optional(),
});

/**
 * POST /api/oauth/token
 *
 * OAuth 2.0 Token endpoint. Exchanges an authorization code for an access token.
 * Accepts form-encoded or JSON body.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'oauth-token', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    let body: Record<string, unknown>;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await request.json();
    }

    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }

    const { code, client_id, client_secret, redirect_uri, code_verifier } = parsed.data;

    const result = await exchangeAuthorizationCode({
      code,
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirect_uri,
      codeVerifier: code_verifier,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        access_token: result.accessToken,
        token_type: result.tokenType,
        expires_in: result.expiresIn,
        scope: result.scope,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/oauth/token:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
