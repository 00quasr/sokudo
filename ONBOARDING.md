# Developer Onboarding Guide

Welcome to Sokudo! This guide will walk you through setting up your development environment and getting your first typing session running.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing Your Setup](#testing-your-setup)
- [Common Issues](#common-issues)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js 20+** - [Download here](https://nodejs.org/)
  ```bash
  node --version  # Should be v20.x.x or higher
  ```

- **pnpm 9+** - Fast, disk space efficient package manager
  ```bash
  npm install -g pnpm
  pnpm --version  # Should be 9.x.x or higher
  ```

- **PostgreSQL 16+** - Database server
  - **Option 1: Local installation** - [Download here](https://www.postgresql.org/download/)
  - **Option 2: Docker** (recommended for simplicity)
    ```bash
    docker run --name sokudo-postgres \
      -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=sokudo \
      -p 5432:5432 \
      -d postgres:16
    ```
  - **Option 3: Cloud database** - [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Vercel Postgres](https://vercel.com/storage/postgres)

- **Stripe CLI** - For webhook testing
  ```bash
  # macOS
  brew install stripe/stripe-cli/stripe

  # Linux
  wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
  tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
  sudo mv stripe /usr/local/bin/

  # Windows
  scoop install stripe

  # Verify installation
  stripe --version
  ```

### Optional but Recommended

- **Git** - Version control
- **VS Code** - With recommended extensions:
  - TypeScript + JavaScript
  - Tailwind CSS IntelliSense
  - Prettier
  - ESLint
  - Drizzle ORM (for database schema editing)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sokudo
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages. You should see output confirming installation of Next.js, React, TypeScript, and other dependencies.

**Troubleshooting:**
- If `pnpm install` fails, try clearing the pnpm cache: `pnpm store prune`
- If you see warnings about peer dependencies, you can usually ignore them
- On Apple Silicon Macs, some native modules may need Rosetta 2

### 3. Set Up Stripe

Sokudo uses Stripe for payment processing. You'll need a Stripe account even for local development.

1. **Create a Stripe account** at [https://stripe.com](https://stripe.com)
2. **Get your API keys** from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - You'll need your **Secret key** (starts with `sk_test_`)
3. **Log in to Stripe CLI**
   ```bash
   stripe login
   ```
   This will open your browser to authenticate.

## Database Setup

### 1. Create Environment File

Run the interactive setup script:

```bash
pnpm db:setup
```

This will:
- Prompt you for your Stripe secret key
- Prompt you for your PostgreSQL connection string
- Generate a secure `AUTH_SECRET` for JWT signing
- Create a `.env` file with all required variables

**Manual setup (if you prefer):**

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/sokudo

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Auth
AUTH_SECRET=<run: openssl rand -hex 32>

# App
BASE_URL=http://localhost:3000

# Optional: OAuth providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Notes:**
- Replace `user`, `password`, `localhost`, and `5432` with your PostgreSQL credentials
- If using Docker with the command from Prerequisites, use: `postgresql://postgres:password@localhost:5432/sokudo`
- For cloud databases (Neon, Supabase), copy the connection string from your dashboard
- We'll get `STRIPE_WEBHOOK_SECRET` in the next step

### 2. Run Database Migrations

Apply the database schema:

```bash
pnpm db:migrate
```

This creates all tables, indexes, and relationships. You should see output like:
```
Applying migrations...
✓ 0000_initial_schema.sql
✓ 0001_add_achievements.sql
...
Migrations complete!
```

**Troubleshooting:**
- **Connection refused**: Make sure PostgreSQL is running
- **Authentication failed**: Check your connection string credentials
- **Database does not exist**: Create the database first: `createdb sokudo` (or specify in connection string)

### 3. Seed the Database

For a full development environment with all categories and test data:

```bash
pnpm db:seed:production
```

This will:
- Create all challenge categories (Git, Terminal, Docker, React, etc.)
- Add hundreds of realistic challenges
- Seed achievement definitions
- Create a test user account

**Verify seeding:**

```bash
pnpm db:studio
```

This opens Drizzle Studio in your browser where you can browse tables and data.

**Alternative: Manual seeding**

For more control, seed individual components:

```bash
pnpm db:seed                    # Users, teams, basic categories
pnpm db:seed:git-basics         # Git category challenges
pnpm db:seed:react              # React category challenges
pnpm db:seed:achievements       # Achievement definitions
```

## Running the Application

### Terminal 1: Start the Dev Server

```bash
pnpm dev
```

This starts the Next.js development server with Turbopack. You should see:

```
  ▲ Next.js 15.x.x (turbopack)
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 1.2s
```

Visit **http://localhost:3000** to see the app.

### Terminal 2: Start Stripe Webhook Listener

In a **separate terminal**, start the Stripe CLI webhook forwarder:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You should see:

```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**Important:** Copy the webhook signing secret (`whsec_xxxxx`) and add it to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Restart your dev server** (Terminal 1) for the change to take effect.

**Why is this needed?**
- Stripe sends webhook events for subscription changes
- The webhook listener forwards test events to your local server
- The signing secret verifies webhook authenticity

## Testing Your Setup

### 1. Sign In

1. Navigate to **http://localhost:3000**
2. Click **Sign In**
3. Use the test credentials:
   - **Email:** `test@test.com`
   - **Password:** `admin123`

You should be redirected to the practice page.

### 2. Try a Typing Session

1. Select **Git Basics** category
2. Click on any challenge
3. Start typing the displayed command
4. Watch your WPM and accuracy update in real-time

**Expected behavior:**
- Correct characters turn green
- Incorrect characters turn red
- Stats update as you type
- Session completes when you finish the text

### 3. Test Premium Flow (Optional)

1. Sign out and create a new account
2. Navigate to **Pricing** page
3. Click **Subscribe** on Base or Plus plan
4. Use Stripe test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiration:** Any future date (e.g., `12/34`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP:** Any 5 digits (e.g., `12345`)
5. Complete checkout

**Verify subscription:**
- You should be redirected back to the app
- Check Terminal 2 (Stripe webhook listener) for webhook events
- Your account should now have premium features unlocked

### 4. Run Tests

Verify the codebase is healthy:

```bash
# Run all tests
pnpm test

# Or run tests once (no watch mode)
pnpm test:run
```

Expected output:
```
✓ 233 tests passed
```

### 5. Build the Application

Before making commits, verify the build succeeds:

```bash
pnpm build
```

This catches TypeScript errors and ensures production build works.

## Common Issues

### Database Connection Errors

**Error:** `connection refused` or `ECONNREFUSED`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # If using Docker
   docker ps | grep postgres

   # If using local installation (macOS)
   brew services list | grep postgresql

   # If using local installation (Linux)
   sudo systemctl status postgresql
   ```
2. Check your `POSTGRES_URL` in `.env` matches your database configuration
3. Test connection manually:
   ```bash
   psql "postgresql://user:password@localhost:5432/sokudo"
   ```

### Stripe Webhook Secret Missing

**Error:** `Stripe webhook signature verification failed`

**Solution:**
1. Make sure `stripe listen` is running in a separate terminal
2. Copy the webhook signing secret from the Stripe CLI output
3. Add it to `.env` as `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
4. Restart your dev server

### Migrations Not Applying

**Error:** `Cannot find module 'drizzle-kit'` or migration failures

**Solutions:**
1. Reinstall dependencies: `pnpm install`
2. Make sure you ran `pnpm db:migrate` not `drizzle-kit migrate` directly
3. Check that your `POSTGRES_URL` is correct in `.env`
4. Drop and recreate database if needed:
   ```bash
   dropdb sokudo
   createdb sokudo
   pnpm db:migrate
   pnpm db:seed:production
   ```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
1. Find and kill the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```
2. Or use a different port:
   ```bash
   PORT=3001 pnpm dev
   ```

### TypeScript Errors on First Run

**Error:** `Cannot find module` or type errors in IDE

**Solutions:**
1. Make sure you ran `pnpm install` successfully
2. Restart your TypeScript server in VS Code:
   - Press `Cmd/Ctrl + Shift + P`
   - Type "Restart TS Server"
3. Check that `node_modules` exists and has content

### OAuth Sign-In Not Working

**Problem:** Google or GitHub sign-in buttons don't appear or fail

**Solution:**
OAuth is optional. If you want to enable it:
1. Create OAuth apps in [Google Cloud Console](https://console.cloud.google.com/) and/or [GitHub Settings](https://github.com/settings/developers)
2. Add redirect URI: `http://localhost:3000/api/auth/callback/google` (or `/github`)
3. Add client ID and secret to `.env`
4. Restart dev server

If you don't need OAuth, the email/password authentication will work fine.

## Next Steps

### Explore the Codebase

Key directories to familiarize yourself with:

- **`app/`** - Next.js App Router pages and API routes
  - `(dashboard)/practice/` - Core typing interface
  - `api/sessions/` - Typing session endpoints
- **`components/`** - React components
  - `typing/` - TypingInput, TypingArea, StatsBar
- **`lib/`** - Core business logic
  - `db/` - Database schema and queries
  - `auth/` - Authentication logic
  - `hooks/` - React hooks (useTypingEngine, etc.)

### Read the Documentation

- **`CLAUDE.md`** - Development guidelines and architecture
- **`README.md`** - Project overview and features
- **`SOKUDO_PROJECT_PLAN.md`** - Feature roadmap and plans

### Pick Up a Task

Check the project board or `PRD.md` for available tasks. Good starter tasks:

- Add new challenges to existing categories
- Fix TypeScript strict mode warnings
- Improve test coverage
- Add new achievement definitions
- Enhance UI components

### Development Workflow

When working on features:

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   pnpm test:run
   ```

4. Build to check for errors:
   ```bash
   pnpm build
   ```

5. Commit with conventional format:
   ```bash
   git commit -m "feat(scope): description"
   ```

   Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

6. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   ```

### Join the Community

- Report bugs or request features via GitHub Issues
- Check existing issues for contribution opportunities
- Follow the coding guidelines in `CLAUDE.md`

## Getting Help

If you're stuck:

1. Check this guide's [Common Issues](#common-issues) section
2. Search existing GitHub issues
3. Review `CLAUDE.md` for development patterns
4. Ask in the project's communication channel
5. Create a detailed GitHub issue with:
   - What you were trying to do
   - What happened instead
   - Error messages (full output)
   - Your environment (OS, Node version, etc.)

---

**Welcome aboard!** Start practicing and happy coding! 🚀
