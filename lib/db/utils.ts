/**
 * Database utility functions for setup verification
 */

import { db, client } from './drizzle';
import { categories, users } from './schema';
import { sql } from 'drizzle-orm';

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Check if migrations have been applied
 * Verifies that essential tables exist
 */
export async function checkMigrations(): Promise<boolean> {
  try {
    // Check if essential tables exist
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as users_exists,
      EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      ) as categories_exists,
      EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'challenges'
      ) as challenges_exists;
    `;

    const { users_exists, categories_exists, challenges_exists } = result[0];
    return users_exists && categories_exists && challenges_exists;
  } catch (error) {
    console.error('Migration check failed:', error);
    return false;
  }
}

/**
 * Check if database has been seeded
 * Looks for categories and test user
 */
export async function checkSeeded(): Promise<boolean> {
  try {
    // Check if categories exist
    const categoryCount = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const hasCategories = categoryCount[0].count > 0;

    // Check if test user exists using raw SQL to avoid schema issues
    const testUserResult = await client`
      SELECT EXISTS (
        SELECT FROM users
        WHERE email = 'test@test.com'
      ) as test_user_exists;
    `;
    const hasTestUser = testUserResult[0].test_user_exists;

    return hasCategories && hasTestUser;
  } catch (error) {
    console.error('Seeding check failed:', error);
    return false;
  }
}
