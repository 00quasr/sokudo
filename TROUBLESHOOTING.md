# Troubleshooting Guide

This guide covers common issues you might encounter when developing, deploying, or using Sokudo, along with their solutions.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Database Issues](#database-issues)
- [Authentication & Session Issues](#authentication--session-issues)
- [Stripe & Payment Issues](#stripe--payment-issues)
- [Typing Engine Issues](#typing-engine-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Performance Issues](#performance-issues)
- [WebSocket & Real-time Features](#websocket--real-time-features)
- [Team & SAML Issues](#team--saml-issues)
- [Development Workflow Issues](#development-workflow-issues)

---

## Setup Issues

### pnpm install fails with peer dependency warnings

**Symptoms:**
```
WARN Issues with peer dependencies found
```

**Solution:**
These warnings are typically safe to ignore. If you want to resolve them:
```bash
pnpm install --strict-peer-dependencies=false
```

### Node version incompatibility

**Error:**
```
The engine "node" is incompatible with this module
```

**Solution:**
Sokudo requires Node.js 20+. Check your version:
```bash
node --version
```

If you need to upgrade:
- Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`
- Or download from [nodejs.org](https://nodejs.org/)

### Turbopack fails to start

**Error:**
```
Failed to compile with Turbopack
```

**Solution:**
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

2. If issue persists, fall back to webpack:
   ```bash
   # Temporarily use webpack instead
   next dev  # without --turbopack flag
   ```

3. Update to latest Next.js:
   ```bash
   pnpm update next
   ```

---

## Database Issues

### Connection pool exhausted

**Error:**
```
Error: Connection pool is full
```

**Cause:**
Too many database connections open, common in development with hot reloading.

**Solution:**
1. Add connection pooling limits to your `POSTGRES_URL`:
   ```bash
   POSTGRES_URL=postgresql://user:pass@host/db?pgbouncer=true&connection_limit=10
   ```

2. Restart your dev server to close old connections

3. For production, use a connection pooler like PgBouncer or Supabase Pooler

### Migration fails: "relation already exists"

**Error:**
```
error: relation "users" already exists
```

**Cause:**
Database already has the schema, but Drizzle doesn't know about it.

**Solution:**
1. **Option 1: Reset database (development only)**
   ```bash
   dropdb sokudo
   createdb sokudo
   pnpm db:migrate
   pnpm db:seed:production
   ```

2. **Option 2: Mark migrations as applied**
   Check the `drizzle_migrations` table and manually mark migrations as complete (advanced).

### Slow queries on typing sessions table

**Symptoms:**
Dashboard or stats pages load slowly.

**Solution:**
Ensure indexes are created. Run this SQL:
```sql
-- Check existing indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'typing_sessions';

-- If missing, create indexes
CREATE INDEX IF NOT EXISTS idx_typing_sessions_user_id ON typing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_created_at ON typing_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_category_id ON typing_sessions(category_id);
```

### Database connection timeout

**Error:**
```
Error: Connection terminated unexpectedly
```

**Solution:**
1. Check if your database server is running
2. Verify firewall rules allow connections
3. For cloud databases (Neon, Supabase), check SSL settings:
   ```bash
   POSTGRES_URL=postgresql://user:pass@host/db?sslmode=require
   ```

### Seed scripts fail with duplicate key errors

**Error:**
```
Error: duplicate key value violates unique constraint
```

**Solution:**
1. Clear existing data before seeding:
   ```bash
   # Connect to database
   psql $POSTGRES_URL

   # Truncate tables (development only!)
   TRUNCATE TABLE typing_sessions, challenges, categories CASCADE;
   ```

2. Or drop and recreate:
   ```bash
   dropdb sokudo
   createdb sokudo
   pnpm db:migrate
   pnpm db:seed:production
   ```

---

## Authentication & Session Issues

### "Unauthorized" or redirect loop after sign-in

**Symptoms:**
- User signs in successfully but immediately redirects to sign-in page
- Console shows 401 Unauthorized errors

**Causes:**
1. `AUTH_SECRET` is missing or changed
2. Cookie settings incompatible with your environment
3. Session expired

**Solutions:**

1. **Verify AUTH_SECRET exists:**
   ```bash
   grep AUTH_SECRET .env
   ```
   If missing, generate one:
   ```bash
   openssl rand -hex 32
   ```

2. **Check cookie settings** (lib/auth/session.ts:53-58):
   - In development behind a proxy: set `secure: false`
   - Cross-origin issues: check `sameSite` setting
   - If using custom domain: ensure `BASE_URL` matches your actual URL

3. **Clear browser cookies:**
   - Open DevTools > Application > Cookies
   - Delete the `session` cookie
   - Try signing in again

4. **Check if BASE_URL is correct:**
   ```bash
   # .env must match your actual host
   BASE_URL=http://localhost:3000  # for local
   # or
   BASE_URL=https://yourdomain.com  # for production
   ```

### JWT verification fails

**Error:**
```
JWTVerifyError: signature verification failed
```

**Cause:**
The `AUTH_SECRET` changed after sessions were created.

**Solution:**
1. All users need to sign in again
2. Update `AUTH_SECRET` in `.env` to the correct value
3. Restart the server
4. Consider implementing a session migration strategy for production

### OAuth sign-in redirects to 404

**Symptoms:**
Google/GitHub OAuth button redirects to a 404 page.

**Solution:**
1. **Verify OAuth credentials in `.env`:**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

2. **Check OAuth app redirect URIs:**
   - Google: Must include `http://localhost:3000/api/auth/callback/google`
   - GitHub: Must include `http://localhost:3000/api/auth/callback/github`

3. **Verify NextAuth configuration** (lib/auth/auth.ts):
   - Ensure providers are properly configured
   - Check that `BASE_URL` is set correctly

### Session expires too quickly

**Issue:**
Users are logged out unexpectedly.

**Solution:**
Adjust session expiration time in `lib/auth/session.ts:29`:
```typescript
// Change from 1 day to 7 days
.setExpirationTime('7 days from now')
```

And update cookie expiration at line 47:
```typescript
const expiresInSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
```

---

## Stripe & Payment Issues

### Webhook signature verification failed

**Error:**
```
Error: Stripe webhook signature verification failed
```

**Causes:**
1. `STRIPE_WEBHOOK_SECRET` is missing or incorrect
2. Stripe CLI not running
3. Webhook endpoint not accessible

**Solutions:**

1. **Ensure Stripe CLI is running:**
   ```bash
   # Terminal 2
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Copy the webhook signing secret:**
   Look for output like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

3. **Update .env:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

4. **Restart dev server** (changes to .env require restart)

5. **For production:** Create a webhook endpoint in Stripe Dashboard and use that secret

### Checkout session not created

**Error:**
```
Error: No such price: 'price_xxx'
```

**Solution:**
1. Verify Stripe prices exist in your dashboard
2. Update price IDs in your code or environment variables
3. Check you're using test mode keys for development:
   - Keys should start with `sk_test_`

### Customer portal redirect fails

**Error:**
User clicks "Manage Subscription" but nothing happens.

**Solution:**
1. Verify `BASE_URL` matches your actual domain in `.env`
2. Check Stripe Customer Portal is configured:
   - Go to https://dashboard.stripe.com/test/settings/billing/portal
   - Enable Customer Portal
   - Configure allowed actions (cancel, update payment method, etc.)

### Subscription webhook not updating database

**Symptoms:**
- User completes checkout
- Stripe shows active subscription
- User still sees free tier limits

**Debug steps:**

1. **Check webhook logs:**
   ```bash
   # In terminal running `stripe listen`
   # Look for events like customer.subscription.created
   ```

2. **Check application logs:**
   Look for errors in webhook handler (app/api/stripe/webhook/route.ts)

3. **Verify webhook handler processes events:**
   Add logging to `lib/payments/stripe.ts`:
   ```typescript
   console.log('Processing webhook event:', event.type);
   ```

4. **Check database:**
   ```bash
   pnpm db:studio
   ```
   - Look at `users` table
   - Verify `stripe_subscription_id` is set
   - Check `stripe_subscription_status` is 'active'

---

## Typing Engine Issues

### WPM calculation seems incorrect

**Issue:**
WPM shows unrealistic values (too high or too low).

**Root cause:**
WPM formula in `lib/typing/wpm.ts` uses standard formula: `(characters / 5) / (time in minutes)`

**Debug:**
1. Check if `durationMs` is being tracked correctly
2. Verify character count includes only successfully typed characters
3. Ensure timer starts on first keystroke, not on page load

**Related code:**
- `lib/typing/wpm.ts` - WPM calculation
- `lib/hooks/useTypingEngine.ts` - Typing state management

### Keystrokes not registering

**Symptoms:**
- User types but characters don't appear
- No green/red feedback

**Causes:**
1. Input focus lost
2. React state update issue
3. Event listener not attached

**Solutions:**

1. **Ensure typing input is focused:**
   Check `components/typing/TypingInput.tsx` - verify autofocus logic

2. **Check browser console for errors:**
   Look for React errors or warnings

3. **Test with simple logging:**
   Add to `useTypingEngine` hook:
   ```typescript
   const handleKeyPress = (key: string) => {
     console.log('Key pressed:', key);
     // rest of logic
   };
   ```

### Accuracy drops to 0% unexpectedly

**Cause:**
Division by zero when total keystrokes is 0, or incorrect error tracking.

**Solution:**
Check accuracy calculation in `lib/hooks/useTypingEngine.ts`:
```typescript
const accuracy = totalKeystrokes > 0
  ? ((totalKeystrokes - errors) / totalKeystrokes) * 100
  : 100;
```

### Session doesn't save after completion

**Symptoms:**
User completes typing session but stats don't appear in history.

**Debug steps:**

1. **Check network tab:** Look for POST to `/api/sessions`
2. **Check server logs:** Look for errors in session creation
3. **Verify user is authenticated:** Session requires valid JWT
4. **Check database constraints:** Ensure all required fields are provided

**Related files:**
- `app/api/sessions/route.ts` - Session creation endpoint
- `lib/db/queries.ts` - Database insertion logic

---

## Build & Deployment Issues

### Type errors during build

**Error:**
```
Type error: Property 'X' does not exist on type 'Y'
```

**Solution:**
1. Run TypeScript check locally:
   ```bash
   npx tsc --noEmit
   ```

2. Fix errors shown in output

3. For strict mode issues, check `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,  // Sokudo uses strict mode
       "noImplicitAny": true
     }
   }
   ```

4. Never use `any` - use proper types or `unknown` with type guards

### Build succeeds but production site crashes

**Symptoms:**
- `pnpm build` completes without errors
- Production site shows 500 error or crashes

**Common causes:**

1. **Missing environment variables:**
   Verify all `.env` variables are set in production:
   ```bash
   POSTGRES_URL=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   AUTH_SECRET=
   BASE_URL=
   ```

2. **Database not migrated:**
   ```bash
   pnpm db:migrate  # Run in production environment
   ```

3. **Server Actions misconfigured:**
   Ensure 'use server' directives are present in server actions

4. **Edge runtime incompatibility:**
   Check if you're using Node.js APIs in Edge runtime functions

### Static export fails

**Error:**
```
Error: Page "/practice/[categorySlug]" is missing "generateStaticParams()"
```

**Cause:**
Sokudo is a dynamic app that requires a Node.js server. It cannot be statically exported.

**Solution:**
Deploy to a platform that supports Next.js SSR:
- Vercel (recommended)
- Netlify
- Railway
- Self-hosted Node.js server

Do NOT use `output: 'export'` in `next.config.ts`

### Image optimization fails in production

**Error:**
```
Error: Invalid src prop
```

**Solution:**
1. Use Next.js Image component correctly:
   ```tsx
   import Image from 'next/image';

   <Image
     src="/images/logo.png"
     width={200}
     height={200}
     alt="Logo"
   />
   ```

2. For external images, configure domains in `next.config.ts`:
   ```typescript
   images: {
     domains: ['yourdomain.com', 'cdn.example.com'],
   }
   ```

---

## Performance Issues

### Dashboard loads slowly

**Symptoms:**
Dashboard page takes 3+ seconds to load.

**Solutions:**

1. **Add database indexes:**
   See [Slow queries](#slow-queries-on-typing-sessions-table) section

2. **Implement pagination:**
   Don't load all sessions at once. Use offset/limit:
   ```typescript
   const sessions = await db
     .select()
     .from(typingSessions)
     .where(eq(typingSessions.userId, userId))
     .orderBy(desc(typingSessions.createdAt))
     .limit(20)
     .offset(page * 20);
   ```

3. **Use React Suspense:**
   ```tsx
   <Suspense fallback={<LoadingSkeleton />}>
     <SessionHistory />
   </Suspense>
   ```

4. **Cache expensive queries:**
   Use React Server Components caching or implement Redis

### Typing input has noticeable lag

**Symptoms:**
Delay between keystroke and visual feedback.

**Causes:**
1. Heavy re-renders
2. Unoptimized state updates
3. Too many DOM nodes

**Solutions:**

1. **Profile with React DevTools:**
   - Install React DevTools browser extension
   - Use Profiler tab to identify slow components

2. **Memoize expensive calculations:**
   ```tsx
   const stats = useMemo(() => calculateWPM(keystrokes), [keystrokes]);
   ```

3. **Debounce non-critical updates:**
   WPM updates don't need to be every keystroke:
   ```typescript
   const [displayWPM, setDisplayWPM] = useState(0);

   useEffect(() => {
     const timer = setTimeout(() => setDisplayWPM(currentWPM), 100);
     return () => clearTimeout(timer);
   }, [currentWPM]);
   ```

4. **Reduce component tree depth:**
   Flatten component hierarchy where possible

### High memory usage

**Symptoms:**
Browser tab uses excessive RAM (1GB+).

**Solutions:**

1. **Check for memory leaks:**
   - Look for missing cleanup in useEffect
   - Ensure timers are cleared
   - Remove event listeners on unmount

2. **Limit keystroke log size:**
   Don't keep full history in memory:
   ```typescript
   // Keep only last 100 keystrokes in state
   setKeystrokes(prev => [...prev.slice(-99), newKeystroke]);
   ```

3. **Clear old sessions from client state:**
   Don't accumulate session data in React state

---

## WebSocket & Real-time Features

### WebSocket connection fails

**Error:**
```
WebSocket connection to 'ws://localhost:3000' failed
```

**Causes:**
1. WebSocket server not running
2. Firewall blocking WebSocket connections
3. Proxy/load balancer not configured for WebSockets

**Solutions:**

1. **Start WebSocket server:**
   ```bash
   pnpm start:ws
   ```

2. **Check if port is accessible:**
   ```bash
   curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" \
     http://localhost:3000
   ```

3. **For production:** Configure your reverse proxy to support WebSockets
   - Nginx: Add `proxy_set_header Upgrade $http_upgrade;`
   - Vercel: WebSockets supported natively

### Race participants not syncing

**Symptoms:**
In typing races, opponent progress doesn't update.

**Debug:**

1. **Check WebSocket connection status:**
   Open browser DevTools > Network > WS tab

2. **Verify messages are being sent:**
   Look for outgoing messages in WS tab

3. **Check server logs:**
   Look for errors in `lib/ws/race-server.ts`

4. **Test with two browser windows:**
   Open race in two windows to verify sync

### Spectator mode shows stale data

**Issue:**
Race spectators see outdated participant positions.

**Solution:**
1. Ensure broadcast interval is reasonable (lib/ws/race-server.ts):
   ```typescript
   // Send updates every 100ms, not every keystroke
   setInterval(() => broadcastRaceState(raceId), 100);
   ```

2. Implement client-side interpolation for smooth updates

---

## Team & SAML Issues

### SAML SSO sign-in fails

**Error:**
```
Error: SAML assertion invalid
```

**Solutions:**

1. **Verify SAML metadata is correct:**
   Check `lib/auth/saml.ts` configuration

2. **Check clock sync:**
   SAML requires accurate system time. Ensure server time is synchronized:
   ```bash
   timedatectl status  # Linux
   ```

3. **Verify ACS URL matches IdP configuration:**
   Should be: `https://yourdomain.com/api/auth/saml/acs`

4. **Check SAML assertion attributes:**
   Ensure IdP sends required attributes (email, name, etc.)

5. **Enable debug logging:**
   Set environment variable:
   ```bash
   SAML_DEBUG=true
   ```

### Team invites not sending

**Symptoms:**
User doesn't receive team invitation email.

**Solutions:**

1. **Check email service configuration:**
   Verify `RESEND_API_KEY` is set in `.env`

2. **Check spam folder:**
   Team invites may be marked as spam

3. **Verify email in database:**
   ```bash
   pnpm db:studio
   # Check team_invitations table
   ```

4. **Check Resend dashboard:**
   Look for delivery logs and errors

### Team member can't access custom challenges

**Issue:**
Team member sees 403 Forbidden on team custom challenges.

**Solution:**
1. Verify user is actually a team member:
   ```sql
   SELECT * FROM team_members WHERE user_id = ? AND team_id = ?;
   ```

2. Check permissions logic in `lib/auth/permissions.ts`

3. Ensure team subscription is active (custom challenges require paid plan)

---

## Development Workflow Issues

### Hot reload not working

**Symptoms:**
Code changes don't trigger browser reload.

**Solutions:**

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   pnpm dev
   ```

2. **Check file watcher limits (Linux):**
   ```bash
   # Increase inotify limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Disable antivirus file monitoring** (Windows)

4. **Use polling as fallback:**
   Edit `next.config.ts`:
   ```typescript
   export default {
     webpack: (config) => {
       config.watchOptions = {
         poll: 1000,
         aggregateTimeout: 300,
       };
       return config;
     },
   };
   ```

### Tests failing locally but passing in CI

**Symptoms:**
`pnpm test` fails on your machine, passes on GitHub Actions.

**Causes:**
1. Different Node versions
2. Missing environment variables in local .env
3. Timezone differences
4. Test data conflicts

**Solutions:**

1. **Match Node version with CI:**
   Check `.github/workflows/` for Node version used in CI

2. **Use test environment file:**
   Create `.env.test`:
   ```bash
   POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/sokudo_test
   ```

3. **Clear test database between runs:**
   ```typescript
   // In test setup
   beforeEach(async () => {
     await db.delete(typingSessions);
     await db.delete(users);
   });
   ```

4. **Fix timezone-dependent tests:**
   ```typescript
   // Bad: assumes timezone
   expect(date.getHours()).toBe(14);

   // Good: use UTC
   expect(date.toISOString()).toContain('2024-01-01');
   ```

### Drizzle Studio shows empty tables after seeding

**Issue:**
`pnpm db:studio` shows tables exist but no data after running seed scripts.

**Solutions:**

1. **Verify seed script completed successfully:**
   Check for errors in seed output

2. **Check you're connecting to the right database:**
   Compare `POSTGRES_URL` in `.env` with Drizzle Studio connection

3. **Re-run seed:**
   ```bash
   pnpm db:seed:production
   ```

4. **Check constraints:**
   Foreign key violations may silently fail inserts

### Git conflicts in auto-generated files

**Files:**
- `tsconfig.tsbuildinfo`
- `.next/`
- `pnpm-lock.yaml` (sometimes)

**Solution:**
1. Add to `.gitignore` (most already are)
2. For lockfile conflicts:
   ```bash
   git checkout --theirs pnpm-lock.yaml
   pnpm install
   git add pnpm-lock.yaml
   ```

---

## Getting Additional Help

If your issue isn't covered here:

1. **Check existing documentation:**
   - `ONBOARDING.md` - Setup issues
   - `CLAUDE.md` - Development guidelines
   - `README.md` - Feature overview

2. **Search GitHub Issues:**
   Someone may have encountered the same problem

3. **Enable debug logging:**
   ```bash
   DEBUG=* pnpm dev
   ```

4. **Check browser console:**
   Many issues show detailed errors in DevTools

5. **Verify environment:**
   ```bash
   pnpm verify  # Runs setup verification script
   ```

6. **Create a minimal reproduction:**
   Isolate the issue to smallest possible code

7. **Open a GitHub Issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages (full output)
   - Environment details (OS, Node version, browser)
   - What you've already tried

---

## Quick Reference Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm test                   # Run tests in watch mode
pnpm test:run              # Run tests once

# Database
pnpm db:migrate            # Run migrations
pnpm db:seed:production    # Seed all data
pnpm db:studio             # Open database GUI

# Debugging
npx tsc --noEmit           # Check TypeScript errors
pnpm verify                # Verify setup
DEBUG=* pnpm dev           # Enable debug logs

# Cleanup
rm -rf .next               # Clear Next.js cache
pnpm store prune           # Clear pnpm cache
dropdb sokudo && createdb sokudo  # Reset database
```

---

**Last updated:** 2026-02-05
