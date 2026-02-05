import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Primary database connection (for writes and consistent reads)
export const client = postgres(process.env.POSTGRES_URL);
export const db = drizzle(client, { schema });

// Read replica connections
const readReplicaUrls = process.env.POSTGRES_READ_REPLICAS
  ? process.env.POSTGRES_READ_REPLICAS.split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
  : [];

// Initialize read replica clients
const readReplicaClients = readReplicaUrls.map((url) => postgres(url));

// Round-robin index for load balancing across read replicas
let currentReplicaIndex = 0;

/**
 * Get a database connection for read operations.
 * Uses read replicas if configured, otherwise falls back to primary.
 * Implements round-robin load balancing across replicas.
 */
export function getReadDb() {
  if (readReplicaClients.length === 0) {
    return db; // Fallback to primary if no replicas configured
  }

  const client = readReplicaClients[currentReplicaIndex];
  currentReplicaIndex = (currentReplicaIndex + 1) % readReplicaClients.length;

  return drizzle(client, { schema });
}

/**
 * Get the primary database connection for write operations.
 * Always returns the primary connection to ensure data consistency.
 */
export function getWriteDb() {
  return db;
}
