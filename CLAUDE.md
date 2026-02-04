# CLAUDE.md

## Project
**Sokudo (速度)** - Developer typing trainer for building muscle memory on git commands, terminal workflows, React patterns, and AI prompts.

Stack: Next.js 15 (App Router, Turbopack), TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS 4, Shadcn/UI, Stripe, Zod

## Commands

```bash
# Dev
pnpm dev              # starts with turbopack
pnpm build
pnpm start

# Database
pnpm db:setup         # creates .env with Stripe keys
pnpm db:generate      # generate migrations
pnpm db:migrate       # run migrations
pnpm db:seed          # seed test data
pnpm db:studio        # open Drizzle Studio

# Stripe (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Structure

```
app/
├── (dashboard)/       # Protected routes (pricing, settings, practice)
│   ├── dashboard/     # User settings pages
│   └── pricing/       # Stripe checkout
├── (login)/           # Auth pages (sign-in, sign-up)
├── api/
│   ├── stripe/        # Webhook & checkout handlers
│   ├── user/          # User API
│   └── team/          # Team API
└── layout.tsx

components/
└── ui/                # Shadcn components

lib/
├── auth/              # JWT session handling + NextAuth OAuth
├── db/                # Drizzle schema, queries, migrations
├── payments/          # Stripe integration
└── utils.ts           # cn() helper
```

## Code Style

- TypeScript strict mode, no `any`
- Named exports preferred
- Server Components by default, `'use client'` only when needed
- Server Actions with `'use server'` for mutations
- Tailwind for all styling (no CSS modules)
- Zod for all validation (forms, API inputs)
- Drizzle for database queries (no raw SQL)

## Git

- Branches: `feature/[name]` or `fix/[name]`
- Commits: `type(scope): message` (feat, fix, refactor, docs, chore)
- Run `pnpm build` before committing to catch type errors
- Never commit as Claude as Co-Author

## Gotchas

- **BASE_URL env** - Must match your actual host for Stripe redirects (not localhost if accessing remotely)
- **Stripe webhooks** - Run `stripe listen` in separate terminal during dev
- **withTeam middleware** - Redirects to sign-in, preserves `priceId` for checkout flow
- **JWT cookies** - Session stored in httpOnly cookie, check `lib/auth/session.ts`
- **OAuth** - Google and GitHub OAuth supported via NextAuth v5, requires respective CLIENT_ID and CLIENT_SECRET env vars
- **Turbopack** - Dev server uses Turbopack, some edge cases may differ from webpack
- **Typing engine** - Track keystroke latency in ms, calculate WPM as (chars/5)/minutes

## Design Principles (UI & UX)

**Core philosophy for a typing trainer:**
- **Dark mode first** - developers prefer dark themes, reduces eye strain
- **Minimal distractions** - typing area must be the sole focus
- **Instant feedback** - real-time error highlighting, no lag
- **Keyboard-centric** - minimal mouse interaction required

**Visual rules:**
- Few colors: dark bg (#0a0a0b), muted text (#a1a1aa), accent for errors (red) and correct (green)
- Syntax highlighting for code: keywords (purple), strings (green), flags (blue), paths (yellow)
- Monospace font for all typing content
- Large, readable text in typing area (18-24px)
- Generous whitespace, no clutter
- No decorative elements in practice mode

**Typing UI specifics:**
- Current character highlighted with cursor
- Typed text shows green (correct) or red (error)
- Upcoming text slightly dimmed
- Stats bar (WPM, accuracy, time) visible but not prominent
- Progress indicator subtle

## UI Development: Screenshot-Driven Workflow

Take screenshots:
- Before changes (baseline)
- After each meaningful change
- Before declaring done

Validate:
- Typing area readability and focus
- Stats visibility without distraction
- Error states (wrong key, session end)
- Loading states
- Mobile responsiveness (typing on tablet)

## Environment

```bash
POSTGRES_URL=           # Neon or other PostgreSQL
STRIPE_SECRET_KEY=      # sk_test_...
STRIPE_WEBHOOK_SECRET=  # whsec_...
BASE_URL=               # http://localhost:3000 or production URL
AUTH_SECRET=            # openssl rand -base64 32
GOOGLE_CLIENT_ID=       # (optional) Google OAuth client ID
GOOGLE_CLIENT_SECRET=   # (optional) Google OAuth client secret
GITHUB_CLIENT_ID=       # (optional) GitHub OAuth client ID
GITHUB_CLIENT_SECRET=   # (optional) GitHub OAuth client secret
```

## Test Credentials

After `pnpm db:seed`:
- Email: `test@test.com`
- Password: `admin123`

Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## Skills

Install skills to enhance Claude's capabilities:

```bash
# Browser automation (for testing flows)
npx skills add vercel-labs/agent-browser

# Frontend & Design
npx skills add vercel-labs/agent-skills/vercel-react-best-practices
npx skills add vercel-labs/agent-skills/web-design-guidelines
npx skills add anthropics/skills/frontend-design

# Database
npx skills add supabase/agent-skills/supabase-postgres-best-practices

# Testing & Quality
npx skills add obra/superpowers/test-driven-development
npx skills add obra/superpowers/systematic-debugging
npx skills add wshobson/agents/code-review-excellence

# Architecture
npx skills add wshobson/agents/architecture-patterns
npx skills add wshobson/agents/nextjs-app-router-patterns
npx skills add wshobson/agents/api-design-principles

# Workflow
npx skills add obra/superpowers/writing-plans
npx skills add obra/superpowers/executing-plans
```

Browse more: https://skills.sh

---

## Agent Browser Usage

Use `agent-browser` for testing user flows:

```bash
# Open and interact
agent-browser open http://localhost:3000
agent-browser snapshot -i              # interactive elements
agent-browser click @e1                # click element
agent-browser fill @e2 "text"          # fill input
agent-browser screenshot /tmp/test.png

# Get info
agent-browser get url
agent-browser get title

# Close
agent-browser close
```

Common test flows:
1. **Signup → Pricing → Checkout**: Verify Stripe redirect works
2. **Login → Dashboard**: Verify session persists
3. **Typing practice**: Test keystroke capture (future)

---

## Ralphy (Autonomous Loop)

**IMPORTANT: Claude does NOT start Ralphy loops.**

When the user wants autonomous tasks, Claude prepares what's needed and provides commands for user to run.

### PRD.md Format

```markdown
## Tasks
- [ ] build typing input component with keystroke tracking
- [ ] add categories table and seed git commands
- [ ] create statistics dashboard with WPM chart
- [ ] implement free tier limits (15 min/day, 3 categories)
- [x] completed task (skipped)
```

### Model Selection

**Opus (default)** - complex reasoning:
```bash
ralphy --prd PRD.md
ralphy "implement typing engine with WPM calculation"
```

**Sonnet** - bulk/simple tasks:
```bash
ralphy --sonnet --prd PRD.md
ralphy --sonnet "add JSDoc to all lib functions"
```

### Task Categorization

**Autonomous (Ralphy):**
- Add new challenge categories (git, docker, react)
- Implement statistics queries
- Build UI components with clear specs
- Database migrations

**Interactive (Claude directly):**
- Typing engine architecture
- Real-time keystroke handling
- UI/UX decisions for practice screen
- Stripe integration edge cases

---

## Links

- Boilerplate: https://github.com/nextjs/saas-starter
- Project Plan: `SOKUDO_PROJECT_PLAN.md`
- Drizzle Docs: https://orm.drizzle.team/
- Stripe Billing: https://stripe.com/docs/billing
- Shadcn/UI: https://ui.shadcn.com/

---

## Typing Engine Reference

Core metrics to track:
```typescript
interface TypingSession {
  wpm: number;           // (correct chars / 5) / minutes
  rawWpm: number;        // (all chars / 5) / minutes
  accuracy: number;      // (correct / total) * 100
  keystrokes: number;
  errors: number;
  durationMs: number;
}

interface KeystrokeEvent {
  timestamp: number;     // ms since session start
  expected: string;
  actual: string;
  isCorrect: boolean;
  latency: number;       // ms since previous keystroke
}
```

WPM calculation: Standard "word" = 5 characters. `WPM = (characters / 5) / (time in minutes)`
