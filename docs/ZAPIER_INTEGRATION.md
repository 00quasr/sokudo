# Zapier Integration Guide

This guide explains how to integrate Sokudo with Zapier for workflow automation.

## Overview

Sokudo provides a comprehensive webhook system that allows you to trigger Zaps based on events in your typing practice workflow. You can also use Actions to read data from Sokudo.

## Features

### Webhook Triggers (Events)

1. **Session Completed** (`session.completed`)
   - Triggered when a user completes a typing practice session
   - Use cases: Track progress in Google Sheets, send notifications, update CRM

2. **Achievement Earned** (`achievement.earned`)
   - Triggered when a user unlocks a new achievement
   - Use cases: Celebrate milestones, send congratulation emails, post to Slack

3. **User Signed Up** (`user.signed_up`)
   - Triggered when a new user creates an account
   - Use cases: Welcome emails, add to mailing list, notify team

4. **Subscription Updated** (`user.subscription_updated`)
   - Triggered when a user's subscription status changes
   - Use cases: Send upgrade confirmation, update billing records, notify sales team

5. **Milestone Reached** (`user.milestone_reached`)
   - Triggered when a user reaches a WPM milestone (50, 75, 100, 125, 150+)
   - Use cases: Celebrate achievements, suggest advanced challenges, send rewards

### Actions (Read Data)

1. **Get User Stats** - Retrieve comprehensive typing statistics
2. **Get Recent Sessions** - Fetch recent practice sessions with filters

## Setup Guide

### Step 1: Create a Webhook in Sokudo

1. Sign in to your Sokudo account
2. Navigate to **Settings** > **Webhooks** (or **Dashboard** > **Integrations**)
3. Click **Create Webhook**
4. Configure your webhook:
   - **URL**: Your Zapier webhook URL (provided by Zapier)
   - **Events**: Select which events to subscribe to
   - **Description**: Optional note about this webhook
5. Save and copy your **webhook secret** (shown only once)

### Step 2: Set Up Your Zap

#### Using Webhooks by Zapier

1. In Zapier, create a new Zap
2. Choose **Webhooks by Zapier** as the trigger
3. Select **Catch Hook**
4. Copy the webhook URL provided by Zapier
5. Paste this URL into Sokudo's webhook creation form (Step 1)
6. Test the webhook using the **Test Webhook** button in Sokudo
7. Verify the test data appears in Zapier
8. Continue building your Zap with actions

#### Verifying Webhook Signatures (Optional but Recommended)

To ensure webhook authenticity, verify the `X-Webhook-Signature` header:

```javascript
// In Zapier Code by Zapier action
const crypto = require('crypto');

const signature = inputData.headers['X-Webhook-Signature']; // e.g., "sha256=abc123..."
const secret = 'your_webhook_secret'; // Store in Zapier Storage or hardcode
const payload = JSON.stringify(inputData.body);

const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}

// Signature is valid, proceed with action
output = inputData.body;
```

### Step 3: Create API Keys for Actions

To use Sokudo Actions in Zapier (e.g., fetch user stats):

1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Configure:
   - **Name**: "Zapier Integration"
   - **Scopes**: Select `read` (or `*` for full access)
   - **Expiration**: Optional expiration date
4. Save and copy your **API key** (shown only once, format: `sk_...`)
5. Store the API key securely in Zapier (use **Webhooks by Zapier** with Bearer authentication)

#### Using API Keys in Zapier

Use **Webhooks by Zapier** with **GET** request:

- **URL**: `https://yourdomain.com/api/v1/user/stats`
- **Headers**:
  - `Authorization`: `Bearer sk_your_api_key_here`

## Webhook Payload Reference

### session.completed

```json
{
  "event": "session.completed",
  "timestamp": "2024-02-05T10:30:00Z",
  "data": {
    "sessionId": 123,
    "challengeId": 45,
    "wpm": 85,
    "rawWpm": 90,
    "accuracy": 95,
    "keystrokes": 250,
    "errors": 12,
    "durationMs": 60000,
    "completedAt": "2024-02-05T10:30:00Z"
  }
}
```

### achievement.earned

```json
{
  "event": "achievement.earned",
  "timestamp": "2024-02-05T10:30:00Z",
  "data": {
    "achievementId": 7,
    "slug": "speed_demon",
    "name": "Speed Demon",
    "description": "Type 100 WPM",
    "icon": "🚀"
  }
}
```

### user.signed_up

```json
{
  "event": "user.signed_up",
  "timestamp": "2024-02-05T10:00:00Z",
  "data": {
    "userId": 42,
    "email": "user@example.com",
    "teamId": 5,
    "signedUpAt": "2024-02-05T10:00:00Z",
    "referralCode": "FRIEND123"
  }
}
```

### user.subscription_updated

```json
{
  "event": "user.subscription_updated",
  "timestamp": "2024-02-05T11:00:00Z",
  "data": {
    "teamId": 5,
    "subscriptionId": "sub_abc123",
    "status": "active",
    "planName": "Pro Plan",
    "productId": "prod_xyz789",
    "updatedAt": "2024-02-05T11:00:00Z"
  }
}
```

### user.milestone_reached

```json
{
  "event": "user.milestone_reached",
  "timestamp": "2024-02-05T10:30:00Z",
  "data": {
    "milestoneType": "wpm",
    "milestoneValue": 100,
    "currentWpm": 105,
    "sessionId": 123,
    "reachedAt": "2024-02-05T10:30:00Z"
  }
}
```

## API Endpoints for Actions

### GET /api/v1/user/stats

Get comprehensive user statistics.

**Headers:**
- `Authorization`: `Bearer sk_your_api_key` (required)

**Response:**
```json
{
  "user": {
    "id": 42,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "stats": {
    "avgWpm": 85,
    "maxWpm": 105,
    "totalSessions": 150,
    "totalPracticeTimeMs": 450000,
    "currentStreak": 7,
    "longestStreak": 21,
    "accuracy": 94.5
  }
}
```

### GET /api/v1/sessions/recent

Get recent typing sessions.

**Headers:**
- `Authorization`: `Bearer sk_your_api_key` (required)

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 10, max: 100)

**Response:**
```json
{
  "sessions": [
    {
      "id": 123,
      "wpm": 85,
      "rawWpm": 90,
      "accuracy": 95,
      "keystrokes": 250,
      "errors": 12,
      "durationMs": 60000,
      "completedAt": "2024-02-05T10:30:00Z",
      "challenge": {
        "id": 45,
        "content": "git commit -m 'Fix typo'",
        "difficulty": "intermediate"
      },
      "category": {
        "id": 2,
        "name": "Git Commands",
        "slug": "git"
      }
    }
  ]
}
```

### POST /api/webhooks/test

Test a webhook event (useful for Zapier setup).

**Headers:**
- Cookie: `session` (requires logged-in user)

**Body:**
```json
{
  "event": "session.completed",
  "testData": {
    // Optional: custom test data
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test webhook event \"session.completed\" dispatched successfully",
  "payload": {
    // The payload that was sent to your webhook
  }
}
```

## Example Zap Workflows

### 1. Log Practice Sessions to Google Sheets

**Trigger:** Session Completed
**Action:** Add row to Google Sheets
**Mapping:**
- Column A: `{{timestamp}}`
- Column B: `{{data__wpm}}`
- Column C: `{{data__accuracy}}`
- Column D: `{{data__durationMs}}`

### 2. Send Slack Notification on Achievement

**Trigger:** Achievement Earned
**Action:** Send Slack message
**Message:** "🎉 Congratulations! You earned the {{data__name}} achievement: {{data__description}}"

### 3. Welcome New Users via Email

**Trigger:** User Signed Up
**Action:** Send email (Gmail, SendGrid, etc.)
**To:** `{{data__email}}`
**Subject:** "Welcome to Sokudo!"
**Body:** Custom welcome message

### 4. Update CRM on Subscription Change

**Trigger:** Subscription Updated
**Action:** Update record in HubSpot/Salesforce
**Mapping:**
- Contact Email: `{{data__email}}`
- Subscription Status: `{{data__status}}`
- Plan Name: `{{data__planName}}`

### 5. Celebrate WPM Milestones

**Trigger:** Milestone Reached
**Filter:** `milestoneType` equals "wpm"
**Action:** Send email with congratulations and badge
**Subject:** "🏆 You reached {{data__milestoneValue}} WPM!"

## Webhook Headers

All webhooks include these headers:

- `Content-Type`: `application/json`
- `X-Webhook-Signature`: `sha256=<hmac_digest>` (for verification)
- `X-Webhook-Event`: Event type (e.g., `session.completed`)
- `X-Webhook-Delivery-Timestamp`: ISO 8601 timestamp
- `User-Agent`: `Sokudo-Webhooks/1.0`

## Retry Logic

Sokudo automatically retries failed webhook deliveries:
- **Attempts**: 3 total attempts
- **Delays**: Immediate, 5 seconds, 30 seconds
- **Timeout**: 10 seconds per delivery
- **Success**: HTTP 2xx status code

## Rate Limits

API endpoints have the following rate limits:

- **Webhook creation**: 10 requests/minute
- **Webhook listing**: 60 requests/minute
- **Webhook testing**: 5 requests/minute
- **User stats**: 60 requests/minute
- **Recent sessions**: 60 requests/minute

## Security Best Practices

1. **Always verify webhook signatures** using the `X-Webhook-Signature` header
2. **Store API keys and webhook secrets securely** (use Zapier Storage or environment variables)
3. **Use HTTPS URLs** for webhook endpoints
4. **Create dedicated API keys** for Zapier with minimal required scopes
5. **Set expiration dates** on API keys if possible
6. **Rotate secrets periodically** by creating new webhooks/API keys

## Troubleshooting

### Webhook not receiving data

1. Check webhook is **active** in Sokudo settings
2. Verify the **URL is correct** and accessible
3. Test using the **Test Webhook** button
4. Check webhook delivery logs in Sokudo
5. Ensure your endpoint returns **HTTP 2xx** status

### API requests failing

1. Verify **API key is valid** and not expired
2. Check the key has the **correct scopes** (read/write/*)
3. Ensure `X-API-Key` header is **correctly formatted**
4. Check you're not exceeding **rate limits**
5. Review API response for specific error messages

### Signature verification failing

1. Ensure you're using the **exact webhook secret** from creation
2. Verify you're **hashing the raw request body** (before JSON parsing)
3. Use **HMAC-SHA256** algorithm
4. Prepend `sha256=` to the hex digest
5. Compare as strings (case-sensitive)

## Support

For issues or questions:
- Email: support@sokudo.app
- Documentation: https://docs.sokudo.app
- GitHub: https://github.com/yourusername/sokudo

## Changelog

### 2024-02-05
- Added `user.signed_up` event
- Added `user.subscription_updated` event
- Added `user.milestone_reached` event
- Added `/api/v1/user/stats` endpoint
- Added `/api/v1/sessions/recent` endpoint
- Added `/api/webhooks/test` endpoint for testing
