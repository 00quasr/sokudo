import { db } from './drizzle';
import { categories, challenges } from './schema';
import { eq } from 'drizzle-orm';

/**
 * SQL challenges covering core database operations:
 * SELECT, JOIN, WHERE, GROUP BY, ORDER BY, indexes, and more
 *
 * 20 challenges total, varying in difficulty:
 * - beginner: simple queries with basic clauses
 * - intermediate: joins, subqueries, aggregations
 * - advanced: complex queries, indexes, optimization
 */
export const sqlChallenges = [
  // === SELECT (4 challenges) ===
  {
    content: 'SELECT * FROM users;',
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Select all columns from the users table',
  },
  {
    content: 'SELECT id, name, email FROM users;',
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Select specific columns from a table',
  },
  {
    content: 'SELECT DISTINCT status FROM orders;',
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Select unique values from a column',
  },
  {
    content: 'SELECT COUNT(*) AS total FROM products;',
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Count all rows and alias the result',
  },

  // === WHERE (4 challenges) ===
  {
    content: "SELECT * FROM users WHERE status = 'active';",
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Filter rows with a condition',
  },
  {
    content: 'SELECT * FROM products WHERE price > 100 AND stock > 0;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Filter with multiple conditions using AND',
  },
  {
    content: "SELECT * FROM orders WHERE status IN ('pending', 'processing');",
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Filter using IN clause for multiple values',
  },
  {
    content: "SELECT * FROM users WHERE email LIKE '%@gmail.com';",
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Filter using pattern matching with LIKE',
  },

  // === JOIN (4 challenges) ===
  {
    content: 'SELECT * FROM orders JOIN users ON orders.user_id = users.id;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Join two tables on a foreign key',
  },
  {
    content: 'SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Left join to include all users even without orders',
  },
  {
    content: 'SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Inner join with table aliases',
  },
  {
    content: 'SELECT * FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id;',
    difficulty: 'advanced' as const,
    syntaxType: 'sql' as const,
    hint: 'Chain multiple joins across three tables',
  },

  // === GROUP BY (4 challenges) ===
  {
    content: 'SELECT status, COUNT(*) FROM orders GROUP BY status;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Group rows and count by status',
  },
  {
    content: 'SELECT user_id, SUM(total) AS revenue FROM orders GROUP BY user_id;',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Sum values grouped by user',
  },
  {
    content: 'SELECT category, AVG(price) FROM products GROUP BY category HAVING AVG(price) > 50;',
    difficulty: 'advanced' as const,
    syntaxType: 'sql' as const,
    hint: 'Filter groups with HAVING clause',
  },
  {
    content: 'SELECT DATE(created_at) AS day, COUNT(*) FROM orders GROUP BY DATE(created_at) ORDER BY day;',
    difficulty: 'advanced' as const,
    syntaxType: 'sql' as const,
    hint: 'Group by date and order results',
  },

  // === INDEXES (4 challenges) ===
  {
    content: 'CREATE INDEX idx_users_email ON users(email);',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Create an index on a column',
  },
  {
    content: 'CREATE UNIQUE INDEX idx_users_email_unique ON users(email);',
    difficulty: 'intermediate' as const,
    syntaxType: 'sql' as const,
    hint: 'Create a unique index to enforce uniqueness',
  },
  {
    content: 'CREATE INDEX idx_orders_user_status ON orders(user_id, status);',
    difficulty: 'advanced' as const,
    syntaxType: 'sql' as const,
    hint: 'Create a composite index on multiple columns',
  },
  {
    content: 'DROP INDEX idx_users_email;',
    difficulty: 'beginner' as const,
    syntaxType: 'sql' as const,
    hint: 'Remove an existing index',
  },
];

export async function seedSqlChallenges() {
  console.log('Seeding SQL challenges...');

  // Get the SQL category
  const [sqlCategory] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'sql'))
    .limit(1);

  if (!sqlCategory) {
    console.error('Error: SQL category not found. Run db:seed first.');
    process.exit(1);
  }

  const categoryId = sqlCategory.id;

  // Insert challenges
  const challengeData = sqlChallenges.map((challenge) => ({
    ...challenge,
    categoryId,
  }));

  await db.insert(challenges).values(challengeData);

  console.log(`Seeded ${sqlChallenges.length} SQL challenges.`);
}

// Run if executed directly
if (require.main === module) {
  seedSqlChallenges()
    .catch((error) => {
      console.error('Seed SQL failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed SQL finished. Exiting...');
      process.exit(0);
    });
}
