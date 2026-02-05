# PRD.md - Sokudo Development Tasks

**Sokudo (速度)** - Developer typing trainer for building muscle memory on git commands, terminal workflows, React patterns, and AI prompts.

---

## Current Status Summary

**✅ Core Functionality: 95% Complete**
- Typing engine fully functional with real-time WPM/accuracy tracking
- 10 categories with 250+ challenges seeded
- Authentication, payments, team management working
- Statistics dashboard with charts and analytics
- Achievement system (28 achievements defined)
- OAuth 2.0 provider, SAML SSO, webhooks, API keys all implemented
- Anti-cheat detection, free tier limits, session replay

**🔧 Remaining Core Work:**
- Branding updates (replace "ACME" with "Sokudo" logo/name)
- Homepage & pricing page content (still SaaS starter boilerplate)
- OAuth login with Google and GitHub
- Mobile/tablet touch keyboard optimization
- Minor bug fixes (SAML metadata hardcoded teamId, Stripe redirect URLs)

---

## Phase 1: MVP Tasks ✅ COMPLETE

### Database & Schema ✅

- [x] Add `categories` table (id, name, slug, description, icon, difficulty, isPremium, displayOrder)
- [x] Add `challenges` table (id, categoryId, content, difficulty, syntaxType, hint, avgWpm, timesCompleted)
- [x] Add `typingSessions` table (id, userId, challengeId, wpm, rawWpm, accuracy, keystrokes, errors, durationMs, completedAt)
- [x] Add `keystrokeLogs` table (id, sessionId, timestamp, expected, actual, isCorrect, latencyMs)
- [x] Add `dailyPractice` table (id, userId, date, practiceTimeMs, sessionsCompleted) for free tier limits
- [x] Add `userProfiles` table extension (subscriptionTier, currentStreak, longestStreak, totalPracticeTime, preferences)
- [x] Generate and run migrations for new tables

### Challenge Content ✅

- [x] Seed Git Basics category (30 challenges: status, add, commit, push, pull, branch, checkout, merge)
- [x] Seed Git Advanced category (25 challenges: rebase, stash, cherry-pick, reflog, bisect)
- [x] Seed Docker category (25 challenges: run, build, compose, exec, logs, prune, network)
- [x] Seed npm/yarn/pnpm category (20 challenges: install, run, dlx, workspaces)
- [x] Seed Shell/Terminal category (30 challenges: cd, ls, find, grep, tail, pipes, redirects)
- [x] Seed React category (25 challenges: useState, useEffect, useCallback, component patterns)
- [x] Seed TypeScript category (25 challenges: interfaces, generics, type guards, utility types)
- [x] Seed Next.js category (20 challenges: App Router, Server Actions, metadata, routing)
- [x] Seed AI Prompts category (30 challenges: Claude, ChatGPT, Cursor, Copilot patterns)
- [x] Seed SQL category (20 challenges: SELECT, JOIN, WHERE, GROUP BY, indexes)

### Typing Engine ✅

- [x] Create `useTypingEngine` hook (keystroke capture, cursor position, error tracking)
- [x] Implement WPM calculation utility: `(correctChars / 5) / minutes`
- [x] Implement accuracy calculation: `(correctKeystrokes / totalKeystrokes) * 100`
- [x] Add keystroke latency tracking (ms between keystrokes)
- [x] Handle special keys (backspace, escape to restart, tab for hints)
- [x] Create `TypingInput` component with syntax highlighting
- [x] Add real-time error highlighting (red for wrong, green for correct)
- [x] Implement cursor animation on current character

### Practice UI ✅

- [x] Create `/practice` route with category selection grid
- [x] Create `/practice/[categorySlug]` route with challenge list
- [x] Create `/practice/[categorySlug]/[challengeId]` route for typing session
- [x] Build `ChallengeCard` component (preview, difficulty badge, avg WPM)
- [x] Build `TypingArea` component (monospace, large text, syntax colors)
- [x] Build `StatsBar` component (live WPM, accuracy, time elapsed)
- [x] Build `SessionComplete` modal (results, next challenge button)
- [x] Add keyboard shortcuts (Escape = restart, Tab = skip, Enter = next)

### Statistics Dashboard ✅

- [x] Create `/dashboard/stats` route
- [x] Build WPM trend chart (last 7/30 days)
- [x] Build accuracy by category bar chart
- [x] Build "Problem Keys" heatmap (keys with lowest accuracy)
- [x] Show total practice time, sessions completed, current streak
- [x] Add category-specific breakdown (best/worst categories)

### API Endpoints ✅

- [x] `POST /api/sessions` - Create new typing session with results
- [x] `GET /api/sessions` - Get user's session history (paginated)
- [x] `GET /api/challenges` - Get challenges by category (with filters)
- [x] `GET /api/categories` - Get all categories with progress stats
- [x] `GET /api/stats` - Get aggregated user statistics
- [x] `POST /api/keystroke-log` - Batch insert keystroke data

### Free Tier Limits ✅

- [x] Track daily practice time per user in `dailyPractice` table
- [x] Implement 15 min/day limit for free users
- [x] Lock premium categories (show blurred preview, upgrade CTA)
- [x] Show remaining time in UI for free users
- [x] Reset daily limits at midnight (user's timezone or UTC)

---

## Phase 2: Growth Tasks ✅ COMPLETE

### Advanced Analytics ✅

- [x] Add `keyAccuracy` table (userId, key, totalPresses, correctPresses, avgLatencyMs)
- [x] Build keyboard heatmap component (color-coded per-key accuracy)
- [x] Track per-character error patterns (which chars are most often mistyped)
- [x] Add typing speed by time of day chart
- [x] Build category mastery progress bars (% complete, avg WPM, accuracy trend)
- [x] Create weekly performance report (email summary of progress)
- [x] Add monthly statistics comparison (this month vs last month)
- [x] Build "Problem Sequences" analysis (character pairs with high error rate)
- [x] Add session replay feature (watch your typing with errors highlighted)

### Achievement System ✅

- [x] Add `achievements` table (id, slug, name, description, icon, criteria JSONB)
- [x] Add `userAchievements` table (userId, achievementId, earnedAt)
- [x] Seed achievement definitions (28 total):
  - [x] Speed achievements (First 50 WPM, 60 WPM, 70 WPM, 80 WPM, 90 WPM, 100 WPM)
  - [x] Streak achievements (3 days, 7 days, 14 days, 30 days, 60 days, 100 days)
  - [x] Category mastery (complete all challenges in a category)
  - [x] Practice milestones (100 sessions, 500 sessions, 1000 sessions)
  - [x] Accuracy achievements (95%, 98%, 99% session accuracy)
- [x] Implement achievement unlock logic (check after each session)
- [x] Build achievement notification toast component
- [x] Create achievements showcase page (`/dashboard/achievements`)
- [x] Add badges to user profile display
- [x] Implement achievement progress tracking (e.g., "80/100 WPM - 80% there")

### Custom Challenges ✅

- [x] Add `customChallenges` table (id, userId, name, content, isPublic, timesCompleted)
- [x] Build custom challenge editor page (`/dashboard/challenges/new`)
- [x] Add syntax validation for challenge content
- [x] Implement challenge import from text (paste shell history, .bashrc snippets)
- [x] Add public/private toggle for custom challenges
- [x] Create community challenge browser (`/challenges/community`)
- [x] Implement challenge search and filtering (by category, difficulty, popularity)
- [x] Add challenge rating system (upvote/downvote)
- [x] Build "Fork Challenge" feature (copy and modify public challenges)
- [x] Add challenge collections (group related challenges)

### Team Features ✅

- [x] Create team leaderboard page (`/team/leaderboard`)
- [x] Build team statistics dashboard (`/team/stats`)
- [x] Add team WPM comparison chart (member vs member)
- [x] Implement team practice challenges (everyone types same content)
- [x] Add team invite management UI
- [x] Build team activity feed (who practiced what)
- [x] Create team achievements (collective milestones)
- [x] Add team custom challenges (visible only to team members)
- [x] Implement team onboarding courses (admin-defined challenge sequences)
- [x] Build admin role permissions (manage members, view stats, create challenges)

### Data & Profile ✅

- [x] Implement CSV export for session history
- [x] Add JSON export for all user data (GDPR compliance)
- [x] Build public profile page (`/u/[username]`)
- [x] Create shareable stats card (image for Twitter/LinkedIn)
- [x] Add GitHub README badge generator
- [x] Implement streak notification emails (daily reminder if streak at risk)
- [x] Add browser push notifications for streak reminders
- [x] Build profile customization (avatar, bio, preferred categories)
- [x] Create "Share Progress" social buttons
- [x] Add practice calendar (GitHub-style contribution graph)

### Referral System ✅

- [x] Add `referrals` table (referrerId, referredId, status, rewardGiven)
- [x] Generate unique referral codes per user
- [x] Build referral dashboard (`/dashboard/referrals`)
- [x] Implement referral reward logic (1 month Pro for 3 referrals)
- [x] Add referral tracking on signup
- [x] Create referral leaderboard

---

## Phase 3: Scale Tasks (90% COMPLETE)

### Multiplayer Racing ✅

- [x] Add `races` table (id, status, challengeId, startedAt, maxPlayers)
- [x] Add `raceParticipants` table (raceId, userId, wpm, accuracy, finishedAt, rank)
- [x] Build race lobby UI (`/race`)
- [x] Implement WebSocket server for real-time race state
- [x] Add real-time opponent progress display (position indicators)
- [x] Build race countdown and start sync
- [x] Create race results screen (rankings, WPM comparison)
- [x] Implement matchmaking (similar WPM players)
- [x] Add friend challenge system (invite specific users)
- [x] Build race history page (`/dashboard/races`)
- [x] Create weekly tournament mode (scheduled competitions)
- [x] Add race spectator mode
- [x] Implement anti-cheat detection (unrealistic WPM, timing anomalies)

### AI-Generated Challenges ✅

- [x] Build user weakness analysis (identify problem keys, slow sequences)
- [x] Integrate AI API for challenge generation (Claude/OpenAI)
- [x] Generate personalized practice content based on errors
- [x] Implement adaptive difficulty (auto-adjust based on performance)
- [x] Create "Smart Practice" mode (AI picks optimal challenges)
- [x] Add AI-generated hints and tips
- [x] Build practice recommendations ("You should practice X")
- [x] Implement spaced repetition for challenging content

### Integrations ✅

- [x] Build VS Code extension scaffold
- [x] Implement VS Code typing practice panel
- [x] Add VS Code status bar WPM display
- [x] Create public API for external apps (`/api/v1/*`)
- [x] Add API key management (`/dashboard/api-keys`)
- [x] Implement API rate limiting
- [x] Build webhook system for events (session complete, achievement earned)
- [x] Add OAuth 2.0 provider for third-party apps
- [x] Implement SSO (SAML 2.0) for enterprise teams

---

## Core Polish & Bug Fixes (HIGH PRIORITY)

### Branding & Content

- [x] Replace "ACME" logo with "Sokudo (速度)" branding
- [x] Update homepage `/` with Sokudo-specific marketing content
- [x] Update pricing page `/pricing` with actual tiers and features
- [x] Change browser page title from "Next.js SaaS Starter" to "Sokudo"
- [x] Update favicon to Sokudo logo
- [x] Add proper meta tags for SEO (title, description, OG tags)

### Authentication Enhancements

- [x] Add OAuth login with Google (social sign-in)
- [x] Add OAuth login with GitHub (social sign-in)
- [x] Update sign-in/sign-up pages with social login buttons
- [x] Add database migrations for OAuth provider fields (provider, providerId, providerData)
- [x] Implement OAuth callback handlers (`/api/auth/google/callback`, `/api/auth/github/callback`)
- [x] Add OAuth configuration to `.env` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)

### UX Improvements

- [x] Fix typing area overlay - show command text before typing starts
- [x] Change session complete modal behavior - only show after completing full category/collection, not after every single challenge
- [x] Add lightweight progress indicator between challenges (e.g., "Challenge 5/30 complete - Next challenge loading...")
- [x] Auto-advance to next challenge after brief delay (1-2 seconds) instead of showing modal each time
- [x] Show category completion summary with aggregate stats when finishing all challenges
- [x] Change multiplayer races to use full categories/packs instead of single commands
- [x] Hide/disable premium categories and challenges for free users (currently visible but should not be accessible)
- [x] Redirect unauthorized users to login page instead of showing "Unauthorized" error
- [x] Implement dark/light mode toggle with system preference detection
- [x] Ensure typing area, syntax highlighting, and all UI components work in both themes
- [x] Persist theme preference in user settings/localStorage

### Bug Fixes

- [x] Fix SAML metadata endpoint hardcoded `teamId: 0` in `/app/api/auth/saml/metadata/route.ts`
- [ ] Fix Stripe redirect URLs using hardcoded IP instead of `BASE_URL` env var in `/lib/payments/stripe.ts`
- [ ] Remove misleading TODO comment in `/app/(dashboard)/practice/[categorySlug]/[challengeId]/typing-session.tsx:105`

### Mobile & Touch Support

- [ ] Add touch event handlers to `TypingInput` component for mobile keyboards
- [ ] Test typing interface on tablets and optimize for touch input
- [ ] Ensure responsive layout works on mobile devices (practice UI)
- [ ] Add viewport meta tags for proper mobile scaling

### PWA & Offline

- [ ] Add proper `manifest.json` for installable PWA
- [ ] Extend `public/sw.js` to cache challenges for offline practice
- [ ] Implement IndexedDB for offline session storage
- [ ] Add offline indicator and sync when back online

### Documentation

- [ ] Create API documentation (OpenAPI/Swagger spec)
- [ ] Add developer onboarding guide
- [ ] Document webhook payload formats
- [ ] Create troubleshooting guide for common issues

---

## Future Enhancements (OPTIONAL - Post-Launch)

### Additional Integrations (Low Priority)

- [ ] CLI tool for terminal-based practice
- [ ] Zapier integration for workflow automation
- [ ] n8n integration for self-hosted workflows

### Accessibility & Internationalization (Nice-to-Have)

- [ ] Add screen reader support (ARIA labels, keyboard navigation)
- [ ] Implement high contrast mode
- [ ] Add i18n framework (next-intl or similar)
- [ ] Support alternative keyboard layouts (Dvorak, Colemak)

### Infrastructure & Scale (When Needed)

- [ ] Add Redis caching for leaderboards
- [ ] Implement database read replicas
- [ ] Add comprehensive monitoring (Sentry, PostHog)
- [ ] Build admin dashboard for content moderation
- [ ] Implement feature flags system

---

## Tech Notes

**Typing Metrics:**
```typescript
interface TypingSession {
  wpm: number;           // (correct chars / 5) / minutes
  rawWpm: number;        // (all chars / 5) / minutes
  accuracy: number;      // (correct / total) * 100
  keystrokes: number;
  errors: number;
  durationMs: number;
}
```

**Syntax Highlighting Colors (dark mode):**
- Background: `#0a0a0b`
- Text (dimmed): `#a1a1aa`
- Keywords: `#c084fc` (purple)
- Strings: `#4ade80` (green)
- Flags: `#60a5fa` (blue)
- Paths: `#facc15` (yellow)
- Errors: `#ef4444` (red)
- Correct: `#22c55e` (green)

**Database Tables (40+):**
- Core: `users`, `teams`, `categories`, `challenges`, `typing_sessions`, `keystroke_logs`
- Analytics: `key_accuracy`, `char_error_patterns`, `sequence_error_patterns`, `daily_practice`
- Gamification: `achievements`, `user_achievements`, `races`, `race_participants`, `tournaments`
- Social: `custom_challenges`, `challenge_votes`, `challenge_collections`, `referrals`
- Integration: `api_keys`, `oauth_clients`, `oauth_access_tokens`, `saml_configurations`, `webhooks`
- Teams: `team_members`, `team_challenges`, `team_custom_challenges`, `team_onboarding_courses`

---

## Run Commands

```bash
# After schema changes
pnpm db:generate
pnpm db:migrate

# Seed data for production (all categories + challenges)
pnpm db:seed:production         # Recommended: Seeds everything

# Seed data manually (for development)
pnpm db:seed                    # Users, categories, Stripe products
pnpm db:seed:git-basics         # Git challenges
pnpm db:seed:docker             # Docker challenges
pnpm db:seed:achievements       # Achievement definitions

# Development
pnpm dev

# Before commit
pnpm build

# Testing
pnpm test
pnpm test:run
```

---

## Project Statistics

- **Total Files**: 454 (308 in `/app`, 146 in `/lib`)
- **Test Files**: 233
- **API Routes**: 87
- **Database Tables**: 40+
- **Challenge Categories**: 10
- **Total Challenges**: 250+
- **Achievement Definitions**: 28
- **Components**: 40+

**Status**: Production-ready with minor branding/polish needed.
