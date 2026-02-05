# Stripe Webhook Documentation

## Overview

Sokudo uses Stripe webhooks to receive real-time notifications about subscription changes. This document describes the webhook payload formats and how they're processed.

## Webhook Endpoint

**Development:** `http://localhost:3000/api/stripe/webhook`
**Production:** `https://your-domain.com/api/stripe/webhook`

**Implementation:** `/root/Github/sokudo/app/api/stripe/webhook/route.ts:8`

## Setup

### Development

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget -qO- https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x64.tar.gz | tar xvz
```

2. Login and start webhook forwarding:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy the webhook signing secret (`whsec_...`) to your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production

1. Configure webhook in Stripe Dashboard:
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to send: Select `customer.subscription.updated` and `customer.subscription.deleted`

2. Copy the signing secret to your production environment variables

## Security

### Signature Verification

All webhook requests are verified using Stripe's signature verification:

```typescript
const signature = request.headers.get('stripe-signature') as string;
const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
```

**Why this matters:**
- Prevents replay attacks
- Ensures requests come from Stripe
- Protects against malicious payloads

### Rate Limiting

Webhook endpoint has rate limiting implemented (lib/rate-limit.ts:4):
- Prevents abuse from malicious actors
- Protects database from excessive writes

## Supported Events

### 1. `customer.subscription.updated`

Fired when a subscription is modified, including:
- Status changes (trialing → active, active → past_due, etc.)
- Plan changes
- Quantity updates
- Trial extensions

### 2. `customer.subscription.deleted`

Fired when a subscription is canceled and the cancellation takes effect.

## Payload Structure

### Base Event Structure

All Stripe webhook events follow this structure:

```typescript
interface StripeEvent {
  id: string;                    // Unique event ID: evt_xxx
  object: "event";
  api_version: string;           // e.g., "2025-04-30.basil"
  created: number;               // Unix timestamp
  type: string;                  // Event type (see below)
  data: {
    object: Subscription;        // The subscription object
    previous_attributes?: object; // For updated events
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}
```

### Subscription Object

The core subscription object in `event.data.object`:

```typescript
interface Subscription {
  id: string;                          // Subscription ID: sub_xxx
  object: "subscription";

  // Customer reference
  customer: string;                    // Customer ID: cus_xxx

  // Status (critical for our logic)
  status:
    | "incomplete"                     // Initial state, payment required
    | "incomplete_expired"             // Payment never completed
    | "trialing"                       // Free trial active
    | "active"                         // Paid and active
    | "past_due"                       // Payment failed, retrying
    | "canceled"                       // Canceled
    | "unpaid";                        // Payment failed, no retry

  // Items (the subscribed products/prices)
  items: {
    object: "list";
    data: SubscriptionItem[];
    has_more: boolean;
    total_count: number;
    url: string;
  };

  // Billing
  billing_cycle_anchor: number;        // Unix timestamp
  current_period_start: number;        // Unix timestamp
  current_period_end: number;          // Unix timestamp

  // Trial
  trial_start: number | null;          // Unix timestamp
  trial_end: number | null;            // Unix timestamp

  // Cancellation
  cancel_at: number | null;            // Scheduled cancellation time
  cancel_at_period_end: boolean;       // Cancel at end of period?
  canceled_at: number | null;          // When canceled
  ended_at: number | null;             // When ended

  // Metadata
  metadata: Record<string, string>;    // Custom key-value pairs

  // Timestamps
  created: number;                     // Unix timestamp

  // Other important fields
  collection_method: "charge_automatically" | "send_invoice";
  currency: string;                    // e.g., "usd"
  default_payment_method: string | null;
  latest_invoice: string | null;       // Invoice ID: in_xxx
}

interface SubscriptionItem {
  id: string;                          // Subscription item ID: si_xxx
  object: "subscription_item";
  created: number;
  metadata: Record<string, string>;
  plan: Plan;                          // The price details
  price: Price;                        // The price object
  quantity: number;                    // Number of units
  subscription: string;                // Parent subscription ID
}

interface Plan {
  id: string;                          // Price ID: price_xxx
  object: "plan";
  active: boolean;
  amount: number | null;               // Amount in cents
  currency: string;
  interval: "day" | "week" | "month" | "year";
  interval_count: number;
  product: string | Product;           // Product ID or expanded object
  nickname: string | null;
}

interface Price {
  id: string;                          // Price ID: price_xxx
  object: "price";
  active: boolean;
  currency: string;
  product: string | Product;           // Product ID or expanded object
  recurring: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
    trial_period_days: number | null;
  } | null;
  type: "one_time" | "recurring";
  unit_amount: number | null;          // Amount in cents
}

interface Product {
  id: string;                          // Product ID: prod_xxx
  object: "product";
  name: string;                        // Product name
  description: string | null;
  active: boolean;
  metadata: Record<string, string>;
}
```

## Example Payloads

### Example 1: Subscription Updated (Trial → Active)

When a trial converts to an active subscription:

```json
{
  "id": "evt_1QVxyz123",
  "object": "event",
  "api_version": "2025-04-30.basil",
  "created": 1706140800,
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1QVabc456",
      "object": "subscription",
      "customer": "cus_NffrFeUfNV2Hib",
      "status": "active",
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_abc123",
            "object": "subscription_item",
            "plan": {
              "id": "price_1234567890",
              "object": "plan",
              "active": true,
              "amount": 2000,
              "currency": "usd",
              "interval": "month",
              "interval_count": 1,
              "product": "prod_ProPlan123"
            },
            "price": {
              "id": "price_1234567890",
              "object": "price",
              "active": true,
              "currency": "usd",
              "product": "prod_ProPlan123",
              "recurring": {
                "interval": "month",
                "interval_count": 1,
                "trial_period_days": 14
              },
              "type": "recurring",
              "unit_amount": 2000
            },
            "quantity": 1
          }
        ]
      },
      "current_period_start": 1706140800,
      "current_period_end": 1708819200,
      "trial_start": 1704672000,
      "trial_end": 1706140800,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "ended_at": null,
      "metadata": {}
    },
    "previous_attributes": {
      "status": "trialing",
      "current_period_start": 1704672000
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_xyz789",
    "idempotency_key": "stripe-billing-automatic-subscription-transition-123"
  }
}
```

**Handler behavior (lib/payments/stripe.ts:121):**
- Extracts `customer`, `subscriptionId`, and `status`
- Finds team by `stripeCustomerId`
- Status is `active` → Updates team with:
  - `stripeSubscriptionId`
  - `stripeProductId`
  - `planName`
  - `subscriptionStatus: "active"`

### Example 2: Subscription Updated (Plan Change)

When user changes from Starter to Pro plan:

```json
{
  "id": "evt_2ABxyz456",
  "object": "event",
  "api_version": "2025-04-30.basil",
  "created": 1706227200,
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1QVabc456",
      "object": "subscription",
      "customer": "cus_NffrFeUfNV2Hib",
      "status": "active",
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_abc123",
            "object": "subscription_item",
            "plan": {
              "id": "price_pro_monthly",
              "object": "plan",
              "active": true,
              "amount": 5000,
              "currency": "usd",
              "interval": "month",
              "interval_count": 1,
              "product": "prod_ProPlan999"
            },
            "quantity": 1
          }
        ]
      },
      "current_period_start": 1706227200,
      "current_period_end": 1708905600,
      "metadata": {}
    },
    "previous_attributes": {
      "items": {
        "data": [
          {
            "plan": {
              "id": "price_starter_monthly",
              "amount": 2000,
              "product": "prod_StarterPlan123"
            }
          }
        ]
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_change789",
    "idempotency_key": null
  }
}
```

**Handler behavior:**
- Status is `active` → Updates team with new product info
- `stripeProductId` changes to `prod_ProPlan999`
- `planName` updates to the new plan's name

### Example 3: Subscription Deleted (Cancellation)

When a subscription is canceled and ends:

```json
{
  "id": "evt_3XYxyz789",
  "object": "event",
  "api_version": "2025-04-30.basil",
  "created": 1708905600,
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_1QVabc456",
      "object": "subscription",
      "customer": "cus_NffrFeUfNV2Hib",
      "status": "canceled",
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_abc123",
            "object": "subscription_item",
            "plan": {
              "id": "price_pro_monthly",
              "object": "plan",
              "active": true,
              "amount": 5000,
              "currency": "usd",
              "interval": "month",
              "interval_count": 1,
              "product": "prod_ProPlan999"
            },
            "quantity": 1
          }
        ]
      },
      "current_period_start": 1706227200,
      "current_period_end": 1708905600,
      "cancel_at_period_end": false,
      "canceled_at": 1706400000,
      "ended_at": 1708905600,
      "metadata": {}
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  }
}
```

**Handler behavior (lib/payments/stripe.ts:143):**
- Status is `canceled` → Updates team with:
  - `stripeSubscriptionId: null`
  - `stripeProductId: null`
  - `planName: null`
  - `subscriptionStatus: "canceled"`
- User reverts to free tier

### Example 4: Subscription Updated (Payment Failed)

When automatic payment fails:

```json
{
  "id": "evt_4CDxyz012",
  "object": "event",
  "api_version": "2025-04-30.basil",
  "created": 1708992000,
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1QVabc456",
      "object": "subscription",
      "customer": "cus_NffrFeUfNV2Hib",
      "status": "past_due",
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_abc123",
            "object": "subscription_item",
            "plan": {
              "id": "price_pro_monthly",
              "amount": 5000,
              "currency": "usd",
              "interval": "month",
              "product": "prod_ProPlan999"
            },
            "quantity": 1
          }
        ]
      },
      "current_period_start": 1708905600,
      "current_period_end": 1711584000,
      "latest_invoice": "in_failedpayment123",
      "metadata": {}
    },
    "previous_attributes": {
      "status": "active"
    }
  },
  "livemode": false,
  "pending_webhooks": 2,
  "request": {
    "id": "req_payment_fail_456",
    "idempotency_key": null
  }
}
```

**Handler behavior:**
- Status is `past_due` (not `active` or `trialing`)
- Our handler doesn't match the condition on line 135
- Falls through switch statement → No database update
- **Note:** Team keeps access until subscription becomes `unpaid` or `canceled`

### Example 5: Subscription Updated (Unpaid)

When payment retries are exhausted:

```json
{
  "id": "evt_5EFxyz345",
  "object": "event",
  "api_version": "2025-04-30.basil",
  "created": 1709596800,
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1QVabc456",
      "object": "subscription",
      "customer": "cus_NffrFeUfNV2Hib",
      "status": "unpaid",
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_abc123",
            "object": "subscription_item",
            "plan": {
              "id": "price_pro_monthly",
              "amount": 5000,
              "currency": "usd",
              "interval": "month",
              "product": "prod_ProPlan999"
            },
            "quantity": 1
          }
        ]
      },
      "current_period_start": 1708905600,
      "current_period_end": 1711584000,
      "ended_at": 1709596800,
      "metadata": {}
    },
    "previous_attributes": {
      "status": "past_due"
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  }
}
```

**Handler behavior (lib/payments/stripe.ts:143):**
- Status is `unpaid` → Updates team with:
  - `stripeSubscriptionId: null`
  - `stripeProductId: null`
  - `planName: null`
  - `subscriptionStatus: "unpaid"`
- User loses access, reverts to free tier

## Handler Logic Flow

```typescript
// app/api/stripe/webhook/route.ts:27-35
switch (event.type) {
  case 'customer.subscription.updated':
  case 'customer.subscription.deleted':
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionChange(subscription);
    break;
  default:
    console.log(`Unhandled event type ${event.type}`);
}
```

### `handleSubscriptionChange` Implementation

Located in `lib/payments/stripe.ts:121-151`:

```typescript
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Find team by Stripe customer ID
  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  // Active or trialing: Update team with subscription details
  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  }
  // Canceled or unpaid: Remove subscription, revert to free
  else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}
```

### Status Handling Matrix

| Stripe Status       | Handler Action                          | User Access |
|--------------------|-----------------------------------------|-------------|
| `trialing`         | ✅ Update subscription details          | Full        |
| `active`           | ✅ Update subscription details          | Full        |
| `past_due`         | ❌ No action (grace period)             | Full*       |
| `unpaid`           | ✅ Clear subscription, set status       | Free tier   |
| `canceled`         | ✅ Clear subscription, set status       | Free tier   |
| `incomplete`       | ❌ No action (initial checkout)         | Free tier   |
| `incomplete_expired`| ❌ No action                           | Free tier   |

*During `past_due`, team retains access until status changes to `unpaid` or `canceled`.

## Common Webhook Scenarios

### Scenario 1: New Paid Subscription (with trial)

**Timeline:**
1. User completes checkout with 14-day trial
2. Stripe creates subscription with `status: "trialing"`
3. Webhook fires: `customer.subscription.updated` (or no event initially)
4. After 14 days: Auto transition to `active`
5. Webhook fires: `customer.subscription.updated` with `status: "active"`

**Code path:**
- Handler catches both trial and active states
- Database updated with subscription info

### Scenario 2: User Cancels Subscription

**Timeline:**
1. User clicks "Cancel" in billing portal
2. Stripe marks `cancel_at_period_end: true`
3. Webhook fires: `customer.subscription.updated` with `status: "active"` but cancellation scheduled
4. At period end: Status changes to `canceled`
5. Webhook fires: `customer.subscription.deleted`

**Code path:**
- Step 3: No database update (still active)
- Step 5: Handler clears subscription details

### Scenario 3: Payment Fails → Recovered

**Timeline:**
1. Payment fails at renewal
2. Webhook fires: `customer.subscription.updated` with `status: "past_due"`
3. Stripe retries payment (configured in Dashboard)
4. Payment succeeds
5. Webhook fires: `customer.subscription.updated` with `status: "active"`

**Code path:**
- Step 2: No database update (grace period)
- Step 5: Subscription remains/becomes active

### Scenario 4: Payment Fails → Not Recovered

**Timeline:**
1. Payment fails at renewal
2. Webhook fires: `customer.subscription.updated` with `status: "past_due"`
3. All retries exhausted (per Stripe settings)
4. Webhook fires: `customer.subscription.updated` with `status: "unpaid"`

**Code path:**
- Step 2: No database update
- Step 4: Handler clears subscription, user loses access

## Testing

### Test with Stripe CLI

```bash
# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger customer.subscription.trial_will_end
```

### Test with Stripe Dashboard

1. Create test subscription in Dashboard
2. Update/cancel subscription
3. Observe webhook events in Developers → Webhooks → Logs

### Manual Testing Checklist

- [ ] Trial starts correctly
- [ ] Trial converts to active
- [ ] Plan upgrade/downgrade works
- [ ] Cancellation at period end works
- [ ] Immediate cancellation works
- [ ] Payment failure grace period
- [ ] Payment recovery after past_due
- [ ] Final unpaid status removes access

## Troubleshooting

### Webhook Not Firing

**Check:**
1. Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Webhook secret matches in `.env`
3. Network allows incoming connections (dev only)
4. Stripe Dashboard webhook endpoint is configured (production)

### Signature Verification Failed

**Causes:**
- Wrong `STRIPE_WEBHOOK_SECRET` in `.env`
- Webhook secret from different Stripe account
- Request body modified before verification
- Replay attack (event too old)

**Fix:**
```bash
# Get new secret from Stripe CLI
stripe listen --print-secret

# Or from Dashboard: Developers → Webhooks → [Your endpoint] → Signing secret
```

### Database Not Updating

**Check:**
1. Team exists with matching `stripeCustomerId`
2. Handler logic conditions (status must be specific values)
3. Database connection is working
4. Console logs: `console.error('Team not found for Stripe customer:', customerId);`

### Duplicate Events

**Stripe may send duplicate events. Our code is idempotent:**
- Multiple identical updates = same database state
- No harm in processing same event twice

**Best practice:**
- Log event IDs to track duplicates
- Consider storing processed event IDs in database

## Monitoring

### What to Monitor

1. **Webhook failures** - Track 4xx/5xx responses
2. **Processing time** - Slow handlers can timeout
3. **Team-customer mismatches** - Orphaned subscriptions
4. **Status transition anomalies** - Unexpected state changes

### Logging Strategy

```typescript
// Add structured logging
console.log({
  event: 'webhook_received',
  type: event.type,
  subscriptionId: subscription.id,
  customerId: subscription.customer,
  status: subscription.status,
  timestamp: new Date().toISOString()
});
```

### Alerting

Set up alerts for:
- High webhook failure rate (>5% in 10 minutes)
- "Team not found" errors
- Signature verification failures (potential security issue)

## References

- **Stripe Webhook Guide:** https://stripe.com/docs/webhooks
- **Subscription Object:** https://stripe.com/docs/api/subscriptions/object
- **Subscription Lifecycle:** https://stripe.com/docs/billing/subscriptions/overview
- **Testing Webhooks:** https://stripe.com/docs/webhooks/test

## Related Files

- `app/api/stripe/webhook/route.ts` - Webhook endpoint
- `lib/payments/stripe.ts` - Stripe integration, handler logic
- `lib/db/queries.ts` - Database queries for teams
- `lib/db/schema.ts` - Team schema with subscription fields
- `lib/rate-limit.ts` - Rate limiting implementation
