import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  const sql = postgres(connectionString as string, { max: 1 });

  console.log('Adding missing columns...');

  try {
    // Add email_verified if missing
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" timestamp`;
    console.log('  ✓ email_verified column added/exists');

    // Add any other potentially missing columns from recent migrations
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text`;
    console.log('  ✓ image column added/exists');

    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider" text`;
    console.log('  ✓ provider column added/exists');

    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider_account_id" text`;
    console.log('  ✓ provider_account_id column added/exists');

    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "provider_data" jsonb`;
    console.log('  ✓ provider_data column added/exists');

    console.log('\nSchema fixes applied successfully!');
  } catch (error) {
    console.error('Error:', error);
  }

  await sql.end();
}

main();
