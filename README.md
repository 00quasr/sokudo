# Hayaku (速く)

**Developer Typing Trainer** - Build muscle memory for git commands, terminal workflows, React patterns, and AI prompts.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

w<img width="3222" height="8658" alt="Screenshot 2026-02-08 at 23-03-01 Home Hayaku" src="https://github.com/user-attachments/assets/c91bab31-1fc6-4516-b3ef-52a47e0eea23" />


## Overvie

Hayaku is a typing trainer designed specifically for developers. Unlike traditional typing tests, Hayaku helps you build muscle memory for:

- **Git commands** - Common workflows, advanced operations
- **Terminal commands** - Shell navigation, file operations, system utilities
- **Docker** - Container management, Dockerfile patterns
- **React/TypeScript** - Component patterns, hooks, type annotations
- **Next.js** - App Router, Server Actions, metadata patterns
- **Package managers** - npm, yarn, pnpm commands
- **SQL queries** - SELECT, JOIN, indexes, aggregations
- **AI prompts** - Effective prompts for Claude, ChatGPT, Cursor, Copilot

### Key Features

- **Real-time WPM tracking** - Live words-per-minute calculation with keystroke latency analysis
- **Smart practice** - AI-selected challenges based on your skill level
- **Personalized practice** - Adaptive difficulty targeting your weak areas
- **Spaced repetition** - SM-2 algorithm to reinforce challenging patterns
- **Achievement system** - 28+ achievements with progression tracking
- **Team features** - Custom challenges, onboarding courses, leaderboards
- **Anti-cheat detection** - Validates realistic typing patterns
- **Session replay** - Review your keystrokes with error timeline
- **OAuth 2.0 provider** - Third-party app integration
- **Webhook system** - Event notifications for external tools
- **SAML SSO** - Enterprise team authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL 16 |
| ORM | Drizzle |
| UI | Tailwind CSS 4, Shadcn/UI |
| Payments | Stripe (subscriptions + webhooks) |
| Auth | JWT sessions, OAuth 2.0, SAML 2.0 |
| Validation | Zod |
| Testing | Vitest (233 test files) |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (or use Docker)
- Stripe CLI

### Installation

```bash
git clone <your-repo-url>
cd hayaku
pnpm install
```

### Database Setup

```bash
# Create .env with Stripe keys and database URL
pnpm db:setup

# Run migrations
pnpm db:migrate

# Option 1: Seed everything for production (recommended)
pnpm db:seed:production

# Option 2: Seed manually (for development/testing)
pnpm db:seed                    # Users, teams, categories
pnpm db:seed:git-basics         # Individual category seeds
pnpm db:seed:achievements
```

### Verify Setup

```bash
# Verify your development environment is properly configured
pnpm verify
```

This checks database connection, migrations, environment variables, and more.

### Development

```bash
# Start Next.js dev server (uses Turbopack)
pnpm dev

# In a separate terminal: listen for Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Visit **http://localhost:3000** to see the app.

**Need help?**
- [ONBOARDING.md](ONBOARDING.md) - Detailed setup instructions
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

### Test Credentials

After seeding, use these credentials to sign in:

- **Email:** `test@test.com`
- **Password:** `admin123`

### Stripe Test Card

- **Card Number:** `4242 4242 4242 4242`
- **Expiration:** Any future date
- **CVC:** Any 3-digit number

## Project Structure

```
app/
├── (dashboard)/           # Protected routes
│   ├── practice/          # Core typing interface
│   │   ├── [categorySlug]/[challengeId]/  # Live typing session
│   │   ├── smart/         # AI-selected practice
│   │   └── personalized/  # Weakness-focused practice
│   ├── dashboard/         # User settings, stats, history
│   │   ├── stats/         # WPM trends, accuracy charts
│   │   ├── history/       # Session replay
│   │   ├── achievements/  # Badge showcase
│   │   └── security/      # OAuth apps, API keys
│   ├── team/              # Team features
│   └── pricing/           # Stripe checkout
├── (login)/               # Auth pages
├── api/
│   ├── sessions/          # Typing session CRUD + validation
│   ├── oauth/             # OAuth 2.0 provider endpoints
│   ├── webhooks/          # Webhook management
│   └── auth/saml/         # SAML SSO integration
└── oauth/authorize/       # OAuth consent UI

components/
├── typing/                # TypingInput, TypingArea, StatsBar
├── stats/                 # Charts (WPM trends, heatmaps, breakdowns)
└── ui/                    # Shadcn components

lib/
├── auth/                  # JWT, OAuth, SAML, API keys
├── db/                    # Drizzle schema, migrations, seed scripts
├── hooks/                 # useTypingEngine, useKeystrokes
├── limits/                # Free tier enforcement (15 min/day)
├── payments/              # Stripe integration
└── webhooks/              # Delivery system with retries
```

## Core Concepts

### Typing Metrics

```typescript
WPM = (correct characters / 5) / minutes
Accuracy = (correct keystrokes / total keystrokes) * 100
```

Standard word = 5 characters. Hayaku tracks both WPM (corrected) and raw WPM (including errors).

### Free Tier Limits

- **15 minutes/day** of practice
- Access to 4 free categories (Git Basics, Git Advanced, Terminal, Package Managers)
- Resets at midnight in user's timezone

### Premium Features

Unlock with Base ($8/mo) or Plus ($12/mo) subscription:

- Unlimited practice time
- 6 premium categories (React, TypeScript, Docker, Next.js, AI Prompts, SQL)
- Smart practice & personalized recommendations
- Team features & custom challenges
- Advanced statistics & insights

### Anti-Cheat System

Sessions are validated for:
- Realistic WPM (< 200 WPM threshold)
- Keystroke timing patterns
- Accuracy consistency
- Duration plausibility

Flagged sessions are rejected by the API.

## API & Integration

### OAuth 2.0 Provider

Hayaku implements a full OAuth 2.0 authorization server with PKCE support:

```bash
# Create OAuth client
POST /api/oauth/clients
{
  "name": "My App",
  "redirectUris": ["https://myapp.com/callback"],
  "scopes": ["read", "write"]
}

# Authorization flow
GET /api/oauth/authorize?client_id=...&redirect_uri=...&code_challenge=...

# Token exchange
POST /api/oauth/token
{
  "grant_type": "authorization_code",
  "code": "...",
  "code_verifier": "..."
}
```

### Webhooks

Subscribe to events:

```bash
POST /api/webhooks
{
  "url": "https://yourapp.com/webhook",
  "events": ["session.completed", "achievement.earned"],
  "description": "My Integration"
}
```

Webhook payloads include HMAC-SHA256 signature in `X-Webhook-Signature` header.

### API Keys

Generate API keys for programmatic access:

```bash
POST /api/keys
{
  "name": "Analytics Script",
  "scopes": ["read"]
}
```

Use in requests:
```bash
curl -H "Authorization: Bearer sk_..." https://hayaku.app/api/v1/sessions
```

## Database

### Schema Highlights

- **40+ tables** with comprehensive relations
- **Typing sessions** - Full metrics, keystroke logs, error patterns
- **Spaced repetition** - SM-2 algorithm for adaptive learning
- **Achievements** - 28 achievement definitions with progress tracking
- **Teams** - Multi-user subscriptions with custom challenges
- **OAuth/SAML** - Enterprise authentication support

### Migrations

```bash
# Generate migration after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio for database browsing
pnpm db:studio
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests once (CI mode)
pnpm test:run
```

**Test Coverage:**
- 233 test files
- Unit tests for typing engine, hooks, utilities
- Component tests for UI elements
- API route tests with mock data
- Database query tests

## Deployment

### Environment Variables

```bash
POSTGRES_URL=postgresql://...           # Database connection
STRIPE_SECRET_KEY=sk_live_...          # Stripe API key
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook signing
BASE_URL=https://yourdomain.com        # Production URL (for redirects)
AUTH_SECRET=<random-64-hex>            # JWT signing secret
```

Generate `AUTH_SECRET`:
```bash
openssl rand -hex 32
```

### Production Checklist

- [ ] Update `BASE_URL` to production domain
- [ ] Create Stripe webhook for production endpoint
- [ ] Configure production PostgreSQL database
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Seed production data: `pnpm db:seed:production`
- [ ] Set up DNS and SSL certificates
- [ ] Configure CORS if needed for API access
- [ ] Monitor webhook delivery failures

### Deploy to Vercel

```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

## Known Issues

1. **SAML Metadata Endpoint** - Hardcoded to `teamId: 0` in `/app/api/auth/saml/metadata/route.ts`. Should accept team parameter.
2. **Stripe Redirect URLs** - Hardcoded IP in `/lib/payments/stripe.ts` instead of using `BASE_URL` env var.
3. **PWA Incomplete** - Service worker only handles push notifications; no offline caching.
4. **Mobile Touch Support** - Typing input may need touch keyboard event handlers for tablets.

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use named exports
3. Server Components by default, `'use client'` only when needed
4. Tailwind for all styling
5. Zod for validation
6. Run `pnpm build` before committing to catch type errors

### Git Workflow

```bash
git checkout -b feature/your-feature
# Make changes
pnpm build  # Check for errors
git add .
git commit -m "feat(scope): description"
git push origin feature/your-feature
```

Commit format: `type(scope): message`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

## Documentation

- **ONBOARDING.md** - New developer setup guide (start here!)
- **CLAUDE.md** - Development guide and architecture
- **HAYAKU_PROJECT_PLAN.md** - Comprehensive feature roadmap
- **PRD.md** - Product requirements and task checklist

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgment

---

**Start practicing:** Sign up, pick a category, and build muscle memory for the commands you use every day.
