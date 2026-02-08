import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database...');

  const sql = postgres(connectionString as string, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations from lib/db/migrations...');

  try {
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
}

main();
