import { createHash, randomBytes } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { apiKeys, users } from '@/lib/db/schema';

const API_KEY_PREFIX = 'sk_';

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex');
  const key = `${API_KEY_PREFIX}${raw}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 12);
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export type ApiKeyUser = {
  id: number;
  email: string;
  name: string | null;
  apiKeyId: number;
  scopes: string[];
};

export async function authenticateApiKey(
  request: Request
): Promise<ApiKeyUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const key = authHeader.slice(7);
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(key);

  const result = await db
    .select({
      apiKeyId: apiKeys.id,
      userId: apiKeys.userId,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      email: users.email,
      name: users.name,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];

  // Check expiration
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
    return null;
  }

  // Update last used timestamp (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.apiKeyId))
    .then(() => {})
    .catch(() => {});

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    apiKeyId: row.apiKeyId,
    scopes: row.scopes as string[],
  };
}

export function hasScope(user: ApiKeyUser, scope: string): boolean {
  return user.scopes.includes(scope) || user.scopes.includes('*');
}
