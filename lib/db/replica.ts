import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { getReadDb, getWriteDb, db } from './drizzle';
import type * as schema from './schema';

type DatabaseInstance = PostgresJsDatabase<typeof schema>;

/**
 * Execute a read query using read replicas (if configured).
 * Falls back to primary database if no replicas are available.
 *
 * @param queryFn Function that accepts a database instance and returns a query
 * @returns Result of the query execution
 *
 * @example
 * const users = await readQuery((db) =>
 *   db.select().from(users).where(eq(users.id, userId))
 * );
 */
export async function readQuery<T>(
  queryFn: (db: DatabaseInstance) => Promise<T>
): Promise<T> {
  const readDb = getReadDb();
  return queryFn(readDb);
}

/**
 * Execute a write query using the primary database.
 * Always routes to the primary to ensure consistency.
 *
 * @param queryFn Function that accepts a database instance and returns a query
 * @returns Result of the query execution
 *
 * @example
 * await writeQuery((db) =>
 *   db.insert(users).values({ email: 'test@example.com' })
 * );
 */
export async function writeQuery<T>(
  queryFn: (db: DatabaseInstance) => Promise<T>
): Promise<T> {
  const writeDb = getWriteDb();
  return queryFn(writeDb);
}

/**
 * Execute a transaction using the primary database.
 * Transactions always use the primary to maintain consistency.
 *
 * @param transactionFn Function that accepts a transaction instance
 * @returns Result of the transaction
 *
 * @example
 * await transaction(async (tx) => {
 *   await tx.insert(users).values({ email: 'test@example.com' });
 *   await tx.insert(profiles).values({ userId: 1 });
 * });
 */
export async function transaction<T>(
  transactionFn: Parameters<typeof db.transaction>[0]
): Promise<T> {
  const writeDb = getWriteDb();
  return writeDb.transaction(transactionFn) as Promise<T>;
}
