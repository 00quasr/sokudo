#!/usr/bin/env tsx

/**
 * Setup Verification Script
 *
 * Checks that the development environment is properly configured.
 * Run this after completing the onboarding steps to verify everything works.
 *
 * Usage: npx tsx scripts/verify-setup.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Check {
  name: string;
  check: () => Promise<boolean> | boolean;
  required: boolean;
  help?: string;
}

const checks: Check[] = [
  {
    name: 'Node.js version >= 20',
    required: true,
    check: () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      return major >= 20;
    },
    help: 'Update Node.js: https://nodejs.org/',
  },
  {
    name: '.env file exists',
    required: true,
    check: () => existsSync(join(process.cwd(), '.env')),
    help: 'Run: pnpm db:setup',
  },
  {
    name: 'POSTGRES_URL is set',
    required: true,
    check: () => {
      const env = loadEnv();
      return !!env.POSTGRES_URL && env.POSTGRES_URL.startsWith('postgresql://');
    },
    help: 'Add POSTGRES_URL to .env file',
  },
  {
    name: 'STRIPE_SECRET_KEY is set',
    required: true,
    check: () => {
      const env = loadEnv();
      return !!env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_');
    },
    help: 'Add STRIPE_SECRET_KEY to .env (get from Stripe Dashboard)',
  },
  {
    name: 'AUTH_SECRET is set',
    required: true,
    check: () => {
      const env = loadEnv();
      return !!env.AUTH_SECRET && env.AUTH_SECRET.length >= 32;
    },
    help: 'Add AUTH_SECRET to .env (run: openssl rand -hex 32)',
  },
  {
    name: 'BASE_URL is set',
    required: true,
    check: () => {
      const env = loadEnv();
      return !!env.BASE_URL && (env.BASE_URL.startsWith('http://') || env.BASE_URL.startsWith('https://'));
    },
    help: 'Add BASE_URL=http://localhost:3000 to .env',
  },
  {
    name: 'node_modules exists',
    required: true,
    check: () => existsSync(join(process.cwd(), 'node_modules')),
    help: 'Run: pnpm install',
  },
  {
    name: 'Database connection',
    required: true,
    check: async () => {
      try {
        const { testDatabaseConnection } = await import('../lib/db/utils');
        return await testDatabaseConnection();
      } catch (error) {
        return false;
      }
    },
    help: 'Check PostgreSQL is running and POSTGRES_URL is correct',
  },
  {
    name: 'Database migrations applied',
    required: true,
    check: async () => {
      try {
        const { checkMigrations } = await import('../lib/db/utils');
        return await checkMigrations();
      } catch (error) {
        return false;
      }
    },
    help: 'Run: pnpm db:migrate',
  },
  {
    name: 'Database is seeded',
    required: false,
    check: async () => {
      try {
        const { checkSeeded } = await import('../lib/db/utils');
        return await checkSeeded();
      } catch (error) {
        return false;
      }
    },
    help: 'Run: pnpm db:seed:production',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET is set',
    required: false,
    check: () => {
      const env = loadEnv();
      return !!env.STRIPE_WEBHOOK_SECRET && env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_');
    },
    help: 'Start Stripe listener and copy the webhook secret to .env',
  },
  {
    name: 'OAuth credentials (Google)',
    required: false,
    check: () => {
      const env = loadEnv();
      return !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;
    },
    help: 'Optional: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for OAuth',
  },
  {
    name: 'OAuth credentials (GitHub)',
    required: false,
    check: () => {
      const env = loadEnv();
      return !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET;
    },
    help: 'Optional: Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET for OAuth',
  },
];

function loadEnv(): Record<string, string> {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return {};
  }

  const envFile = readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};

  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

async function runChecks() {
  console.log('🔍 Verifying Sokudo development environment...\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failedChecks: { name: string; help?: string }[] = [];

  for (const check of checks) {
    try {
      const result = await check.check();

      if (result) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        if (check.required) {
          console.log(`❌ ${check.name}`);
          failed++;
          failedChecks.push({ name: check.name, help: check.help });
        } else {
          console.log(`⚠️  ${check.name} (optional)`);
          skipped++;
        }
      }
    } catch (error) {
      if (check.required) {
        console.log(`❌ ${check.name} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
        failedChecks.push({ name: check.name, help: check.help });
      } else {
        console.log(`⚠️  ${check.name} (optional) - Skipped`);
        skipped++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} optional skipped`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('❌ Setup incomplete. Fix the following issues:\n');
    failedChecks.forEach(({ name, help }) => {
      console.log(`   • ${name}`);
      if (help) {
        console.log(`     → ${help}`);
      }
    });
    console.log('\nSee ONBOARDING.md for detailed setup instructions.');
    process.exit(1);
  } else {
    console.log('✅ All required checks passed!');
    if (skipped > 0) {
      console.log(`\n💡 ${skipped} optional feature${skipped > 1 ? 's are' : ' is'} not configured.`);
      console.log('   These are not required but enable additional functionality.');
    }
    console.log('\n🚀 You\'re ready to start development!');
    console.log('   Run: pnpm dev');
    process.exit(0);
  }
}

runChecks().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
