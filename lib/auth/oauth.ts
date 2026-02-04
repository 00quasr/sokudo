import { createHash, randomBytes } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  oauthClients,
  oauthAuthorizationCodes,
  oauthAccessTokens,
  users,
} from '@/lib/db/schema';

const OAUTH_CLIENT_ID_PREFIX = 'sokudo_';
const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateClientCredentials(): {
  clientId: string;
  clientSecret: string;
  clientSecretHash: string;
} {
  const raw = randomBytes(24).toString('hex');
  const clientId = `${OAUTH_CLIENT_ID_PREFIX}${randomBytes(16).toString('hex')}`;
  const clientSecret = `secret_${raw}`;
  const clientSecretHash = hashSecret(clientSecret);
  return { clientId, clientSecret, clientSecretHash };
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function generateAuthorizationCode(): string {
  return randomBytes(48).toString('hex');
}

export function generateAccessToken(): string {
  return `sok_at_${randomBytes(32).toString('hex')}`;
}

export type OAuthTokenUser = {
  id: number;
  email: string;
  name: string | null;
  oauthClientId: number;
  scopes: string[];
};

export async function authenticateOAuthToken(
  request: Request
): Promise<OAuthTokenUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer sok_at_')) {
    return null;
  }

  const token = authHeader.slice(7);
  const tokenHash = hashSecret(token);

  const result = await db
    .select({
      tokenId: oauthAccessTokens.id,
      clientId: oauthAccessTokens.clientId,
      userId: oauthAccessTokens.userId,
      scopes: oauthAccessTokens.scopes,
      expiresAt: oauthAccessTokens.expiresAt,
      revokedAt: oauthAccessTokens.revokedAt,
      email: users.email,
      name: users.name,
    })
    .from(oauthAccessTokens)
    .innerJoin(users, eq(oauthAccessTokens.userId, users.id))
    .where(
      and(
        eq(oauthAccessTokens.tokenHash, tokenHash),
        isNull(oauthAccessTokens.revokedAt),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];

  if (new Date(row.expiresAt) < new Date()) {
    return null;
  }

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    oauthClientId: row.clientId,
    scopes: row.scopes as string[],
  };
}

export async function createAuthorizationCode(params: {
  clientDbId: number;
  userId: number;
  redirectUri: string;
  scopes: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): Promise<string> {
  const code = generateAuthorizationCode();
  const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRY_MS);

  await db.insert(oauthAuthorizationCodes).values({
    code,
    clientId: params.clientDbId,
    userId: params.userId,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
    codeChallenge: params.codeChallenge ?? null,
    codeChallengeMethod: params.codeChallengeMethod ?? null,
    expiresAt,
  });

  return code;
}

export async function exchangeAuthorizationCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<{
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
} | null> {
  // Look up the authorization code
  const [authCode] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.code, params.code))
    .limit(1);

  if (!authCode) {
    return null;
  }

  // Check if code is already used
  if (authCode.usedAt) {
    return null;
  }

  // Check if code is expired
  if (new Date(authCode.expiresAt) < new Date()) {
    return null;
  }

  // Verify the client
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(
      and(
        eq(oauthClients.id, authCode.clientId),
        eq(oauthClients.clientId, params.clientId),
        eq(oauthClients.active, true)
      )
    )
    .limit(1);

  if (!client) {
    return null;
  }

  // Verify client secret
  const secretHash = hashSecret(params.clientSecret);
  if (secretHash !== client.clientSecretHash) {
    return null;
  }

  // Verify redirect URI
  if (authCode.redirectUri !== params.redirectUri) {
    return null;
  }

  // Verify PKCE code verifier if code challenge was provided
  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      return null;
    }
    const method = authCode.codeChallengeMethod || 'plain';
    let computedChallenge: string;
    if (method === 'S256') {
      computedChallenge = createHash('sha256')
        .update(params.codeVerifier)
        .digest('base64url');
    } else {
      computedChallenge = params.codeVerifier;
    }
    if (computedChallenge !== authCode.codeChallenge) {
      return null;
    }
  }

  // Mark code as used
  await db
    .update(oauthAuthorizationCodes)
    .set({ usedAt: new Date() })
    .where(eq(oauthAuthorizationCodes.id, authCode.id));

  // Generate access token
  const accessToken = generateAccessToken();
  const tokenHash = hashSecret(accessToken);
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS);
  const scopes = authCode.scopes as string[];

  await db.insert(oauthAccessTokens).values({
    tokenHash,
    clientId: client.id,
    userId: authCode.userId,
    scopes,
    expiresAt,
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
    scope: scopes.join(' '),
  };
}

export async function validateRedirectUri(
  clientId: string,
  redirectUri: string
): Promise<{ valid: boolean; clientDbId?: number }> {
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(
      and(eq(oauthClients.clientId, clientId), eq(oauthClients.active, true))
    )
    .limit(1);

  if (!client) {
    return { valid: false };
  }

  const uris = client.redirectUris as string[];
  if (!uris.includes(redirectUri)) {
    return { valid: false };
  }

  return { valid: true, clientDbId: client.id };
}

export const VALID_OAUTH_SCOPES = ['read', 'write'] as const;

export function validateScopes(scopes: string[]): boolean {
  return scopes.every((s) =>
    (VALID_OAUTH_SCOPES as readonly string[]).includes(s)
  );
}
