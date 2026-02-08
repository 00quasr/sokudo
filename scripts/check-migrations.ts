import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    const result = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY id`;
    console.log('Applied migrations:', result.length);
    result.forEach((m: any) => console.log(`  - ${m.hash}`));
  } catch (error) {
    console.error('Error:', error);
  }

  await sql.end();
}

main();
