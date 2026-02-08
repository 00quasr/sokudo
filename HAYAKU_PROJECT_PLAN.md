# Sokudo (速度) - Developer Typing Trainer

**Sokudo** = Velocity/Speed in Japanese

## 🎯 Project Vision

A specialized typing practice platform for developers who want to build muscle memory for common coding patterns, terminal commands, and AI-assisted development workflows. Think Keybr.com, but laser-focused on the commands and patterns developers type hundreds of times per day.

### Why This Product?

The "vibe coding" era has changed how developers work. With AI assistants like Claude, Cursor, Copilot, and ChatGPT, developers are writing more natural language prompts, terminal commands, and framework-specific patterns than ever before. Yet no typing trainer exists specifically for this workflow.

**Pain Points We Solve:**
- Developers waste time hunting for keys on git commands they use daily
- AI prompt patterns require specific syntax that benefits from muscle memory
- Framework boilerplate (React hooks, Next.js patterns) is typed repeatedly
- Terminal workflows involve the same commands hundreds of times

**Target Audience:**
- Junior developers learning command-line workflows
- Senior developers wanting to increase velocity
- Bootcamp students learning frameworks
- Developers transitioning to AI-assisted development

---

## 🏗️ Technology Stack

### Core Framework

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, excellent DX |
| **Language** | TypeScript | Type safety for complex typing logic |
| **Styling** | Tailwind CSS + Shadcn/UI | Rapid development, consistent design |
| **Database** | PostgreSQL | Relational data, great for analytics |
| **ORM** | Drizzle ORM | Type-safe, lightweight, fast |
| **Auth** | Custom JWT (built-in) | Simple email/password, stored in cookies |
| **Payments** | Stripe | Industry standard for subscriptions |
| **Hosting** | Vercel | Zero-config Next.js deployment |
| **Email** | Resend (add later) | Transactional emails |
| **Analytics** | PostHog or Plausible (add later) | Privacy-focused user analytics |

### Why This Stack?

**Next.js 14** with App Router provides:
- Server components for fast initial page loads (critical for typing apps)
- API routes for backend logic
- Excellent Vercel integration
- Strong TypeScript support

**PostgreSQL + Drizzle** because:
- Typing statistics require complex queries (WPM over time, accuracy trends)
- Relational model fits user → sessions → keystrokes
- Drizzle is lighter than Prisma with better performance
- Already configured in the Vercel SaaS Starter

**Built-in JWT Auth** because:
- Simple and lightweight (no external service needed)
- Already integrated in the boilerplate
- Can upgrade to Clerk/Auth.js later if needed

**Tailwind + Shadcn/UI** because:
- Syntax highlighting requires custom styling
- Shadcn components are copy-paste (no dependency lock-in)
- Easy theming for dark mode (essential for developers)

---

## 📦 SaaS Boilerplate: Official Vercel SaaS Starter

### Why This Boilerplate?

We're using the **Official Next.js SaaS Starter** by Vercel - it's free, minimal, and includes everything we need:

| Feature | Included |
|---------|----------|
| **Stripe Payments** | ✅ Subscriptions, Customer Portal, Webhooks |
| **Authentication** | ✅ Email/password with JWT cookies |
| **Database** | ✅ PostgreSQL + Drizzle ORM |
| **UI Components** | ✅ Shadcn/UI |
| **Teams/RBAC** | ✅ Owner & Member roles |
| **Dashboard** | ✅ CRUD operations |
| **Activity Logging** | ✅ User event tracking |
| **Price** | **FREE** (MIT License) |

**GitHub:** https://github.com/nextjs/saas-starter  
**Demo:** https://next-saas-start.vercel.app/  
**Stars:** 15.2k ⭐

### What's Included Out of the Box

```
├── app/
│   ├── (dashboard)/        # Protected dashboard pages
│   ├── (login)/            # Auth pages (sign-in, sign-up)
│   ├── api/stripe/         # Stripe webhook handlers
│   └── pricing/            # Pricing page with Stripe Checkout
├── components/ui/          # Shadcn/UI components
├── lib/
│   ├── db/                 # Drizzle schema & queries
│   ├── auth/               # JWT authentication
│   └── payments/           # Stripe integration
└── middleware.ts           # Route protection
```

### Quick Start

```bash
# 1. Clone the boilerplate
git clone https://github.com/nextjs/saas-starter sokudo
cd sokudo

# 2. Install dependencies
pnpm install

# 3. Login to Stripe CLI (install first: https://docs.stripe.com/stripe-cli)
stripe login

# 4. Run setup script (creates .env file with Stripe keys)
pnpm db:setup

# 5. Set up database (need a PostgreSQL URL - use Neon.tech for free)
# Add POSTGRES_URL to .env

# 6. Run migrations & seed
pnpm db:migrate
pnpm db:seed

# 7. Start development
pnpm dev

# 8. In separate terminal, listen for Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Default Test Credentials
After seeding, you can log in with:
- **Email:** test@test.com
- **Password:** admin123

### Free Database Options

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| **Neon** | 0.5 GB, auto-suspend | Development & small projects |
| **Supabase** | 500 MB, 2 projects | If you want auth later |
| **Railway** | $5 free credit | Quick setup |
| **Vercel Postgres** | 256 MB | Seamless Vercel integration |

**Recommended:** [Neon.tech](https://neon.tech) - generous free tier, instant setup

---

## 🎮 Core Features

### MVP Features (Phase 1)

#### 1. Typing Engine
```typescript
interface TypingSession {
  id: string;
  userId: string;
  categoryId: string;
  challengeId: string;
  startedAt: Date;
  completedAt: Date | null;
  
  // Metrics
  wpm: number;           // Words per minute
  accuracy: number;      // Percentage correct
  rawWpm: number;        // WPM without error correction
  keystrokes: number;    // Total keys pressed
  errors: number;        // Mistake count
  
  // Detailed data
  keystrokeLog: KeystrokeEvent[];
}

interface KeystrokeEvent {
  timestamp: number;     // ms since session start
  expected: string;      // Character expected
  actual: string;        // Character typed
  isCorrect: boolean;
  latency: number;       // ms since previous keystroke
}
```

#### 2. Challenge Categories

**Terminal Commands**
```
// Git (Essential)
git status
git add .
git commit -m "feat: add user authentication"
git push origin main
git checkout -b feature/new-feature
git merge --no-ff develop
git rebase -i HEAD~3
git stash pop
git log --oneline --graph
git diff HEAD~1

// Docker
docker-compose up -d
docker exec -it container_name bash
docker build -t myapp:latest .
docker logs -f container_name
docker system prune -af

// npm/yarn/pnpm
npm install --save-dev typescript
npm run build && npm run start
npx create-next-app@latest my-app
yarn add -D @types/node
pnpm dlx shadcn-ui@latest add button

// System Navigation
cd ~/projects && ls -la
find . -name "*.ts" -type f
grep -r "TODO" --include="*.ts"
chmod +x scripts/deploy.sh
tail -f logs/app.log | grep ERROR
```

**AI/Vibe Coding Prompts**
```
// Common Patterns
Create a React component that...
Refactor this function to use...
Write a unit test for...
Explain what this code does:
Fix the TypeScript error in...
Add error handling to...
Convert this to async/await...
Optimize this database query...

// Cursor/Copilot Shortcuts
// @workspace explain
// @terminal run tests
// /edit add loading state
// /doc generate JSDoc
```

**Code Patterns**
```typescript
// React Hooks
const [state, setState] = useState<Type>(initialValue);
const value = useMemo(() => computation, [deps]);
const callback = useCallback((arg) => fn(arg), [deps]);
useEffect(() => { return () => cleanup; }, [deps]);

// Next.js Patterns
export default async function Page({ params }: Props) {}
export async function generateMetadata({ params }: Props) {}
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

// TypeScript
interface Props { children: React.ReactNode; }
type Status = 'idle' | 'loading' | 'success' | 'error';
const fn = <T extends object>(arg: T): T => arg;
```

**Framework Boilerplate**
```typescript
// API Route (App Router)
export async function GET(request: NextRequest) {
  const data = await fetchData();
  return NextResponse.json(data);
}

// Server Action
'use server'
export async function submitForm(formData: FormData) {
  const name = formData.get('name') as string;
  await db.insert(users).values({ name });
  revalidatePath('/users');
}

// Drizzle Schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 3. Statistics Dashboard
- WPM trend over time (line chart)
- Accuracy by category (bar chart)
- Problem keys heatmap
- Streak calendar (GitHub-style)
- Personal records

#### 4. User Profiles
- Progress tracking
- Achievement badges
- Custom challenges (paste your own commands)
- Settings (theme, keyboard layout)

### Premium Features (Phase 2)

#### For Pro Users
- **Unlimited categories** (free tier: 3 categories)
- **Custom lessons** - paste your shell history, .bashrc, or snippets
- **Detailed analytics** - per-key accuracy, problematic sequences
- **Export data** - CSV/JSON export of all statistics
- **No daily limit** (free tier: 15 min/day)
- **Priority support**

#### For Teams
- **Team leaderboards**
- **Admin dashboard** - track team progress
- **Custom team challenges** - company-specific commands
- **Onboarding courses** - curated for new hires
- **SSO integration** (SAML/OIDC)
- **Usage analytics**

### Future Features (Phase 3)
- **Multiplayer races** - real-time typing competitions
- **AI-generated challenges** - personalized based on weak points
- **IDE extensions** - practice without leaving VS Code
- **Mobile app** - practice on the go
- **API access** - integrate into other tools
- **Keyboard firmware** - QMK/ZMK integration for split keyboards

---

## 💰 Pricing Strategy

### Pricing Philosophy
- **Affordable** - developers are price-sensitive for tools
- **Simple** - three clear tiers, no confusion
- **Value-based** - free tier is genuinely useful, not crippled

### Pricing Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRICING                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   FREE             PRO                 TEAM                      │
│   €0/mo            €4/mo               €3/user/mo                │
│                    (or €36/year)       (min 5 users)             │
│                                                                  │
│   ✓ 3 categories   ✓ All categories   ✓ Everything in Pro       │
│   ✓ Basic stats    ✓ Full analytics   ✓ Team leaderboards       │
│   ✓ 15 min/day     ✓ Unlimited        ✓ Admin dashboard         │
│   ✓ Public profile ✓ Custom lessons   ✓ SSO integration         │
│                    ✓ Data export      ✓ Custom challenges       │
│                    ✓ Priority support ✓ Onboarding courses       │
│                                                                  │
│   [Start Free]     [Upgrade]          [Contact Sales]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Revenue Projections

**Conservative Scenario (Year 1)**
| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Free users | 500 | 2,000 | 8,000 |
| Pro subscribers | 25 | 150 | 600 |
| Team seats | 0 | 20 | 100 |
| MRR | €100 | €660 | €2,700 |
| ARR | - | - | €32,400 |

**Growth Scenario (Year 1)**
| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Free users | 1,000 | 5,000 | 20,000 |
| Pro subscribers | 50 | 400 | 2,000 |
| Team seats | 0 | 50 | 500 |
| MRR | €200 | €1,750 | €9,500 |
| ARR | - | - | €114,000 |

### Conversion Strategy
1. **Free tier hooks** - enough to be useful, limits encourage upgrade
2. **Trial prompts** - "Unlock all categories with Pro" after hitting limit
3. **Social proof** - show how many developers are improving
4. **Streak preservation** - "Don't lose your 30-day streak! Upgrade to continue"

---

## 🗄️ Database Schema

```sql
-- Users (managed by Clerk, but we store preferences)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    keyboard_layout VARCHAR(20) DEFAULT 'qwerty',
    theme VARCHAR(20) DEFAULT 'dark',
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, pro, team
    subscription_expires_at TIMESTAMP,
    streak_current INTEGER DEFAULT 0,
    streak_longest INTEGER DEFAULT 0,
    streak_last_activity DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories (Git, Docker, React, etc.)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    difficulty VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, advanced
    is_premium BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Challenges (individual typing exercises)
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- The text to type
    description TEXT, -- Optional explanation
    difficulty VARCHAR(20) DEFAULT 'intermediate',
    estimated_time_seconds INTEGER,
    is_premium BOOLEAN DEFAULT FALSE,
    times_completed INTEGER DEFAULT 0,
    avg_wpm DECIMAL(5,2),
    avg_accuracy DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Typing Sessions
CREATE TABLE typing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    
    -- Core metrics
    wpm DECIMAL(5,2) NOT NULL,
    raw_wpm DECIMAL(5,2) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    
    -- Detailed metrics
    total_keystrokes INTEGER NOT NULL,
    correct_keystrokes INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    
    -- Status
    completed BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Keystroke Log (for detailed analysis)
CREATE TABLE keystroke_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES typing_sessions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- Character position in challenge
    expected_char VARCHAR(10) NOT NULL,
    actual_char VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    latency_ms INTEGER NOT NULL, -- Time since previous keystroke
    timestamp_ms INTEGER NOT NULL, -- Time since session start
    created_at TIMESTAMP DEFAULT NOW()
);

-- Custom User Challenges
CREATE TABLE custom_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    times_practiced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements/Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    criteria JSONB NOT NULL, -- { type: 'streak', value: 30 }
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Daily Practice Tracking (for free tier limits)
CREATE TABLE daily_practice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    practice_date DATE NOT NULL,
    total_seconds INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    UNIQUE(user_id, practice_date)
);

-- Teams (for team tier)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    stripe_subscription_id VARCHAR(255),
    max_seats INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON typing_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON typing_sessions(created_at);
CREATE INDEX idx_sessions_challenge_id ON typing_sessions(challenge_id);
CREATE INDEX idx_keystroke_session_id ON keystroke_logs(session_id);
CREATE INDEX idx_daily_practice_user_date ON daily_practice(user_id, practice_date);
CREATE INDEX idx_challenges_category ON challenges(category_id);
```

### Drizzle Schema

```typescript
// schema/users.ts
import { pgTable, uuid, varchar, text, boolean, integer, timestamp, date, decimal } from 'drizzle-orm/pg-core';

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  keyboardLayout: varchar('keyboard_layout', { length: 20 }).default('qwerty'),
  theme: varchar('theme', { length: 20 }).default('dark'),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  streakCurrent: integer('streak_current').default(0),
  streakLongest: integer('streak_longest').default(0),
  streakLastActivity: date('streak_last_activity'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  isPremium: boolean('is_premium').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  description: text('description'),
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  estimatedTimeSeconds: integer('estimated_time_seconds'),
  isPremium: boolean('is_premium').default(false),
  timesCompleted: integer('times_completed').default(0),
  avgWpm: decimal('avg_wpm', { precision: 5, scale: 2 }),
  avgAccuracy: decimal('avg_accuracy', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const typingSessions = pgTable('typing_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => userProfiles.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'set null' }),
  wpm: decimal('wpm', { precision: 5, scale: 2 }).notNull(),
  rawWpm: decimal('raw_wpm', { precision: 5, scale: 2 }).notNull(),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }).notNull(),
  totalKeystrokes: integer('total_keystrokes').notNull(),
  correctKeystrokes: integer('correct_keystrokes').notNull(),
  errorCount: integer('error_count').notNull(),
  durationMs: integer('duration_ms').notNull(),
  completed: boolean('completed').default(true),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 🎨 UI/UX Design

### Design Principles

1. **Dark mode first** - developers prefer dark themes
2. **Minimal distractions** - focus on the typing area
3. **Instant feedback** - real-time error highlighting
4. **Keyboard-centric** - minimal mouse interaction

### Key Screens

#### Home / Landing Page
```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] Sokudo          [Login] [Start Free]                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│     Build Muscle Memory for Developer Commands                 │
│                                                                │
│     Practice typing git commands, Docker, React patterns,      │
│     and AI prompts until they become second nature.            │
│                                                                │
│              [Start Practicing - It's Free]                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  git commit -m "feat: add user auth_"                    │ │
│  │                                      ▌                    │ │
│  │  WPM: 72  |  Accuracy: 98%  |  Streak: 12 days          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Categories: [Git] [Docker] [React] [TypeScript] [AI Prompts] │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Typing Practice Screen
```
┌────────────────────────────────────────────────────────────────┐
│  [← Back]  Git Commands - Intermediate        [Settings] [?]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │   git checkout -b feature/user-authentication            │ │
│  │   ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                                    │ │
│  │   git checkout -b feature/us                             │ │
│  │                        ▌ (cursor)                        │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│           WPM          Accuracy        Time                    │
│           68           96.2%           0:23                    │
│                                                                │
│  Progress: ████████████░░░░░░░░ 62%                           │
│                                                                │
│  [ESC to pause]                              [Tab to restart]  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Statistics Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] Sokudo    [Practice] [Stats] [Settings]   [@username] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Your Progress                         🔥 14 day streak        │
│                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│  │  WPM Over Time          │  │  Accuracy by Category       │ │
│  │  📈 [line chart]        │  │  📊 [bar chart]             │ │
│  │                         │  │                             │ │
│  │  Avg: 72 WPM            │  │  Git: 97%  Docker: 94%     │ │
│  │  Best: 89 WPM           │  │  React: 91%  TS: 88%       │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                                │
│  Problem Keys                    Recent Achievements           │
│  ┌───────────────────────┐      ┌─────────────────────────┐   │
│  │  [Keyboard Heatmap]   │      │  🏆 Speed Demon (80 WPM) │   │
│  │  Red = slow/errors    │      │  🔥 2 Week Streak        │   │
│  │  | = most errors      │      │  ⭐ Git Master           │   │
│  └───────────────────────┘      └─────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Color Palette

```css
/* Dark Theme (default) */
:root {
  --bg-primary: #0a0a0b;      /* Near black */
  --bg-secondary: #141417;    /* Card backgrounds */
  --bg-tertiary: #1c1c21;     /* Input backgrounds */
  
  --text-primary: #fafafa;    /* Main text */
  --text-secondary: #a1a1aa;  /* Muted text */
  --text-muted: #52525b;      /* Very muted */
  
  --accent-primary: #6366f1;  /* Indigo - primary actions */
  --accent-success: #22c55e;  /* Green - correct */
  --accent-error: #ef4444;    /* Red - errors */
  --accent-warning: #f59e0b;  /* Amber - warnings */
  
  --border: #27272a;          /* Subtle borders */
}

/* Syntax Highlighting */
--syntax-keyword: #c084fc;    /* Purple - git, docker */
--syntax-string: #4ade80;     /* Green - quoted strings */
--syntax-flag: #60a5fa;       /* Blue - flags like -m, --hard */
--syntax-path: #fbbf24;       /* Yellow - file paths */
--syntax-comment: #6b7280;    /* Gray - comments */
```

---

## 🛠️ Development Roadmap

### Phase 1: MVP (Weeks 1-4)

**Week 1: Foundation**
- [ ] Clone Vercel SaaS Starter
- [ ] Set up Neon PostgreSQL database
- [ ] Configure Stripe products (Free, Pro tiers)
- [ ] Deploy initial version to Vercel
- [ ] Test auth flow and payments

**Week 2: Core Typing Engine**
- [ ] Build typing input component
- [ ] Real-time WPM/accuracy calculation
- [ ] Error highlighting with syntax colors
- [ ] Session recording to database

**Week 3: Content & Categories**
- [ ] Create initial challenge content (Git, Docker, npm)
- [ ] Category selection UI
- [ ] Challenge progression logic
- [ ] Extend database schema for typing sessions

**Week 4: Polish & Launch**
- [ ] Update landing page for Sokudo branding
- [ ] User dashboard with basic stats
- [ ] Free tier limits (15 min/day, 3 categories)
- [ ] Beta launch!

### Phase 2: Growth (Weeks 5-8)

**Week 5-6: Enhanced Features**
- [ ] Detailed analytics dashboard
- [ ] Keyboard heatmap
- [ ] Achievement system
- [ ] Streak tracking

**Week 7-8: Premium & Teams**
- [ ] Custom challenge creation
- [ ] Team management
- [ ] Leaderboards
- [ ] Data export

### Phase 3: Scale (Months 3-6)

- [ ] Multiplayer races
- [ ] AI-generated personalized challenges
- [ ] VS Code extension
- [ ] Mobile responsive improvements
- [ ] API for integrations
- [ ] Community challenges marketplace

---

## 🔒 Security Considerations

### Authentication
- Built-in JWT auth with cookies (already in boilerplate)
- Can upgrade to Clerk or Auth.js later for social login, MFA
- Password hashing with bcrypt (already configured)

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS everywhere (Vercel handles this)
- Implement rate limiting on API routes
- Sanitize all user input

### Payment Security
- Never handle card data directly (use Stripe Elements)
- Verify webhook signatures (already in boilerplate)
- Implement idempotency for payment operations

### Privacy
- GDPR compliance: data export, deletion
- Privacy policy and ToS pages
- Cookie consent (if using analytics)

---

## 📈 Marketing Strategy

### Launch Channels

1. **Product Hunt Launch**
   - Prepare assets (screenshots, video demo)
   - Schedule for Tuesday/Wednesday
   - Engage with comments

2. **Developer Communities**
   - Reddit: r/webdev, r/programming, r/learnprogramming
   - Hacker News (Show HN)
   - Dev.to article
   - Twitter/X developer community

3. **Content Marketing**
   - Blog: "How I Improved My Git Command Speed by 40%"
   - YouTube: Demo videos, typing challenges
   - Newsletter: Weekly tips, new challenges

4. **SEO**
   - Target: "developer typing practice", "git command typing", "code typing trainer"
   - Blog content around productivity

### Growth Tactics

1. **Referral Program**
   - Give 1 month Pro for referring 3 friends
   - Referral leaderboard

2. **Public Profiles**
   - Shareable stats cards for Twitter/LinkedIn
   - Embeddable badges for GitHub READMEs

3. **Partnerships**
   - Bootcamps (bulk team licenses)
   - Developer tool companies (co-marketing)
   - Coding YouTubers (sponsorships)

---

## 💡 Competitive Advantages

| Us (Sokudo 速度) | Keybr | Typing.com | MonkeyType |
|--------------|-------|------------|------------|
| Developer-focused content | General text | General/edu | Random words |
| Syntax highlighting | None | None | None |
| Command categories | Adaptive letters | Lessons | Custom modes |
| AI prompt training | N/A | N/A | N/A |
| Framework patterns | N/A | N/A | N/A |
| Team features | N/A | Classroom | N/A |

### Moat Building
1. **Content library** - Curated, high-quality developer commands
2. **Community** - User-submitted challenges, leaderboards
3. **Integrations** - VS Code extension, CLI tool
4. **Data insights** - "Developers who improved X also practiced Y"

---

## 📝 Content Strategy

### Initial Challenge Library

| Category | # Challenges | Difficulty Mix |
|----------|--------------|----------------|
| Git Basics | 30 | 20B / 8I / 2A |
| Git Advanced | 25 | 5B / 12I / 8A |
| Docker | 25 | 10B / 10I / 5A |
| npm/yarn/pnpm | 20 | 12B / 6I / 2A |
| Shell Navigation | 30 | 15B / 10I / 5A |
| React Patterns | 25 | 5B / 15I / 5A |
| TypeScript | 25 | 5B / 12I / 8A |
| Next.js | 20 | 5B / 10I / 5A |
| AI Prompts | 30 | 15B / 10I / 5A |
| SQL | 20 | 10B / 7I / 3A |
| **Total** | **250** | |

### Challenge Quality Guidelines

1. **Real-world** - Commands developers actually use
2. **Progressive** - Each category has clear difficulty progression
3. **Explained** - Optional hints/explanations for learning
4. **Tested** - All commands verified to work

---

## 🚀 Getting Started Checklist

### Immediate Actions

- [ ] **Domain**: Register sokudo.dev (or sokudo.io, sokudo.codes)
- [ ] **GitHub**: Fork https://github.com/nextjs/saas-starter
- [ ] **Design**: Create Figma mockups for typing screen
- [ ] **Content**: Write first 50 Git challenges

### Week 1 Setup

- [ ] **Database**: Set up PostgreSQL on [Neon.tech](https://neon.tech) (free)
- [ ] **Stripe**: Create account, get API keys
- [ ] **Clone & Run**: 
  ```bash
  git clone https://github.com/nextjs/saas-starter sokudo
  cd sokudo && pnpm install
  pnpm db:setup
  pnpm db:migrate && pnpm db:seed
  pnpm dev
  ```
- [ ] **Vercel**: Connect repo, configure environment

### Pre-Launch

- [ ] **Legal**: Privacy policy, Terms of Service
- [ ] **Analytics**: Set up PostHog or Plausible
- [ ] **Error Tracking**: Configure Sentry
- [ ] **Status Page**: Set up Checkly or similar

---

## 📚 Resources

### Our Boilerplate
- **Official Vercel SaaS Starter** (FREE): https://github.com/nextjs/saas-starter
- Live Demo: https://next-saas-start.vercel.app/

### Tech Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Stripe Subscriptions](https://stripe.com/docs/billing)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Neon PostgreSQL](https://neon.tech/docs)

### Design Inspiration
- [Keybr.com](https://www.keybr.com/) - Adaptive learning
- [MonkeyType](https://monkeytype.com/) - Clean typing UI
- [TypeRacer](https://play.typeracer.com/) - Multiplayer races
- [typing.io](https://typing.io/) - Code-focused (paid)

### Other SaaS Boilerplates (if you need more features later)
- [ShipFast](https://shipfa.st/) ($169) - More marketing features
- [Supastarter](https://supastarter.dev/) ($299) - Full-featured, i18n
- [next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter) (FREE) - Admin panel, user roles

---

*Last updated: February 2026*
*Document version: 1.0*
