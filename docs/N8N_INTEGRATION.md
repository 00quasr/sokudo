# n8n Integration Guide

This guide explains how to integrate Sokudo with n8n for self-hosted workflow automation.

## Overview

Sokudo provides a comprehensive webhook system and REST API that integrates seamlessly with n8n, the fair-code workflow automation tool. Build powerful automations for your typing practice workflow using n8n's visual workflow editor.

## Why n8n?

- **Self-hosted**: Full control over your data and workflows
- **Open source**: Fair-code licensed, extensible
- **Visual editor**: Build workflows with drag-and-drop nodes
- **400+ integrations**: Connect to databases, APIs, and services
- **No vendor lock-in**: Export and migrate workflows freely

## Features

### Webhook Triggers (Events)

1. **Session Completed** (`session.completed`)
   - Triggered when a user completes a typing practice session
   - Use cases: Track progress in PostgreSQL, send notifications, update dashboards

2. **Achievement Earned** (`achievement.earned`)
   - Triggered when a user unlocks a new achievement
   - Use cases: Celebrate milestones, send emails, post to Mattermost/Discord

3. **User Signed Up** (`user.signed_up`)
   - Triggered when a new user creates an account
   - Use cases: Welcome emails, add to database, notify admins

4. **Subscription Updated** (`user.subscription_updated`)
   - Triggered when a user's subscription status changes
   - Use cases: Send upgrade confirmation, update billing records, trigger workflows

5. **Milestone Reached** (`user.milestone_reached`)
   - Triggered when a user reaches a WPM milestone (50, 75, 100, 125, 150+)
   - Use cases: Celebrate achievements, send rewards, update leaderboards

### Actions (Read Data)

1. **Get User Stats** - Retrieve comprehensive typing statistics via HTTP Request
2. **Get Recent Sessions** - Fetch recent practice sessions with filters

## Setup Guide

### Prerequisites

- n8n instance (self-hosted or n8n.cloud)
- Sokudo account with webhook access
- Basic understanding of n8n workflows

### Step 1: Create a Webhook in Sokudo

1. Sign in to your Sokudo account
2. Navigate to **Settings** > **Webhooks** (or **Dashboard** > **Integrations**)
3. Click **Create Webhook**
4. Configure your webhook:
   - **URL**: Your n8n webhook URL (from Step 2)
   - **Events**: Select which events to subscribe to
   - **Description**: Optional note (e.g., "n8n workflow automation")
5. Save and copy your **webhook secret** (shown only once, starts with `whsec_`)

### Step 2: Set Up Webhook Trigger in n8n

1. In n8n, create a new workflow
2. Add a **Webhook** node as the trigger
3. Configure the Webhook node:
   - **HTTP Method**: POST
   - **Path**: Choose a unique path (e.g., `/sokudo-webhooks`)
   - **Authentication**: None (we'll verify signature in the next step)
   - **Response**:
     - **Mode**: Respond Immediately
     - **Status Code**: 200
4. Copy the **Production Webhook URL** from n8n
5. Paste this URL into Sokudo's webhook creation form (Step 1)

### Step 3: Verify Webhook Signatures (Recommended)

To ensure webhook authenticity, verify the `X-Webhook-Signature` header using n8n's **Function** node:

Add a **Function** node after the Webhook trigger:

```javascript
// Get signature from headers
const signature = $input.item.headers['x-webhook-signature'];
const secret = 'your_webhook_secret'; // Store in n8n credentials or environment variable
const payload = JSON.stringify($input.item.json);

// Import crypto
const crypto = require('crypto');

// Calculate expected signature
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Verify signature
if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature - potential security issue');
}

// Signature is valid, pass through the payload
return $input.item.json;
```

**Best Practice:** Store the webhook secret in n8n Credentials:
1. Go to **Credentials** in n8n
2. Create a new **Generic Credential**
3. Add a field for `webhook_secret`
4. Reference it in the Function node: `const secret = $credentials.sokudo.webhook_secret;`

### Step 4: Test the Webhook

1. In Sokudo, click the **Test Webhook** button next to your webhook
2. Select an event type (e.g., `session.completed`)
3. Send the test
4. In n8n, check the Webhook node executions to verify data received
5. Review the Function node to ensure signature verification passed

### Step 5: Create API Keys for HTTP Requests

To fetch data from Sokudo (e.g., user stats) in your n8n workflows:

1. Go to **Settings** > **API Keys** in Sokudo
2. Click **Create API Key**
3. Configure:
   - **Name**: "n8n Integration"
   - **Scopes**: Select `read` (or `*` for full access)
   - **Expiration**: Optional expiration date
4. Save and copy your **API key** (shown only once, format: `sk_...`)
5. Store the API key in n8n Credentials (recommended) or directly in HTTP Request nodes

#### Using API Keys in n8n

Add an **HTTP Request** node to your workflow:

**Method:** GET
**URL:** `https://yourdomain.com/api/v1/user/stats`

**Authentication:**
- **Authentication**: Generic Credential Type
- **Generic Auth Type**: Header Auth
- **Name**: `Authorization`
- **Value**: `Bearer sk_your_api_key_here`

Or manually add headers:
- **Send Headers**: Yes
- **Header Parameters**:
  - Name: `Authorization`
  - Value: `Bearer sk_your_api_key_here`

## Webhook Payload Reference

All webhook payloads follow this structure:

```json
{
  "event": "event.name",
  "timestamp": "ISO 8601 timestamp",
  "data": {
    // Event-specific data
  }
}
```

### session.completed

Triggered when a typing practice session is completed.

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

**n8n Access Path Examples:**
- WPM: `{{ $json.data.wpm }}`
- Accuracy: `{{ $json.data.accuracy }}`
- Duration (seconds): `{{ $json.data.durationMs / 1000 }}`

### achievement.earned

Triggered when a user unlocks a new achievement.

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

**n8n Access Path Examples:**
- Achievement Name: `{{ $json.data.name }}`
- Icon: `{{ $json.data.icon }}`
- Description: `{{ $json.data.description }}`

### user.signed_up

Triggered when a new user creates an account.

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

**n8n Access Path Examples:**
- Email: `{{ $json.data.email }}`
- User ID: `{{ $json.data.userId }}`

### user.subscription_updated

Triggered when a user's subscription status changes.

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

**n8n Access Path Examples:**
- Plan Name: `{{ $json.data.planName }}`
- Status: `{{ $json.data.status }}`

### user.milestone_reached

Triggered when a user reaches a WPM milestone.

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

**n8n Access Path Examples:**
- Milestone: `{{ $json.data.milestoneValue }}`
- Current WPM: `{{ $json.data.currentWpm }}`

## API Endpoints for HTTP Request Nodes

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

**n8n HTTP Request Configuration:**
- **Method**: GET
- **URL**: `https://yourdomain.com/api/v1/user/stats`
- **Authentication**: Header Auth with `Authorization: Bearer sk_...`

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

**n8n HTTP Request Configuration:**
- **Method**: GET
- **URL**: `https://yourdomain.com/api/v1/sessions/recent?limit=20`
- **Authentication**: Header Auth with `Authorization: Bearer sk_...`

## Example n8n Workflows

### 1. Log Practice Sessions to PostgreSQL

**Workflow:**
1. **Webhook** trigger (session.completed)
2. **Function** node (verify signature)
3. **PostgreSQL** node (insert row)

**PostgreSQL Insert:**
```sql
INSERT INTO typing_sessions (timestamp, wpm, accuracy, duration_seconds)
VALUES (
  '{{ $json.timestamp }}',
  {{ $json.data.wpm }},
  {{ $json.data.accuracy }},
  {{ $json.data.durationMs / 1000 }}
)
```

### 2. Send Discord/Mattermost Notification on Achievement

**Workflow:**
1. **Webhook** trigger (achievement.earned)
2. **Function** node (verify signature)
3. **Discord/Mattermost** node (send message)

**Message:**
```
🎉 Achievement Unlocked: {{ $json.data.name }}
{{ $json.data.description }}
{{ $json.data.icon }}
```

### 3. Welcome New Users via Email (SMTP)

**Workflow:**
1. **Webhook** trigger (user.signed_up)
2. **Function** node (verify signature)
3. **Send Email** node (SMTP)

**Configuration:**
- **To**: `{{ $json.data.email }}`
- **Subject**: "Welcome to Sokudo!"
- **Email Type**: HTML
- **Text**: Custom welcome message

### 4. Update Airtable on Subscription Change

**Workflow:**
1. **Webhook** trigger (subscription.updated)
2. **Function** node (verify signature)
3. **Airtable** node (update record)

**Airtable Update:**
- **Base**: Your CRM base
- **Table**: Customers
- **Operation**: Update
- **Record ID**: `{{ $json.data.teamId }}`
- **Fields to Update**:
  - `Subscription Status`: `{{ $json.data.status }}`
  - `Plan Name`: `{{ $json.data.planName }}`

### 5. Celebrate WPM Milestones with Email

**Workflow:**
1. **Webhook** trigger (milestone.reached)
2. **Function** node (verify signature)
3. **IF** node (check `{{ $json.data.milestoneType === 'wpm' }}`)
4. **HTTP Request** node (get user stats to fetch email)
5. **Send Email** node

**Email:**
- **Subject**: `🏆 You reached {{ $json.data.milestoneValue }} WPM!`
- **Body**: Congratulatory message with stats

### 6. Real-time Dashboard Updates via Webhook

**Workflow:**
1. **Webhook** trigger (session.completed)
2. **Function** node (verify signature + calculate daily average)
3. **HTTP Request** node (POST to your dashboard API)

**Function node example:**
```javascript
// Calculate if this is a new personal best
const currentWpm = $json.data.wpm;
const previousBest = $node["HTTP Request"].json.stats.maxWpm;

return {
  json: {
    isNewBest: currentWpm > previousBest,
    wpm: currentWpm,
    timestamp: $json.timestamp
  }
};
```

### 7. Auto-backup Sessions to Google Sheets (Self-hosted)

**Workflow:**
1. **Webhook** trigger (session.completed)
2. **Function** node (verify signature)
3. **Google Sheets** node (append row)

**Sheet Row:**
- Column A: `{{ $json.timestamp }}`
- Column B: `{{ $json.data.wpm }}`
- Column C: `{{ $json.data.accuracy }}`
- Column D: `{{ $json.data.errors }}`
- Column E: `{{ $json.data.durationMs / 1000 }}`

## Advanced n8n Features

### Conditional Logic

Use **IF** nodes to filter events:

```javascript
// Only trigger for high WPM sessions
{{ $json.data.wpm > 100 }}

// Only trigger for specific achievements
{{ $json.data.slug === 'speed_demon' }}

// Only trigger during work hours
{{ $now.hour() >= 9 && $now.hour() <= 17 }}
```

### Error Handling

Add **Error Trigger** nodes to handle webhook failures:

1. Add **Error Trigger** node to workflow
2. Connect to **Send Email** or **Discord** notification
3. Include error details: `{{ $json.error.message }}`

### Batch Processing

Use **Batch** node to group multiple webhook events:

1. **Webhook** trigger (session.completed)
2. **Wait** node (accumulate for 5 minutes)
3. **Batch** node (process all accumulated items)
4. **Function** node (calculate aggregate stats)
5. **Send** to database or notification service

### Scheduled Data Sync

Combine webhooks with **Cron** nodes:

1. **Cron** trigger (daily at midnight)
2. **HTTP Request** (GET /api/v1/sessions/recent?limit=100)
3. **Loop Over Items** node
4. **PostgreSQL** insert or update

## Webhook Headers

All webhooks include these headers:

- `Content-Type`: `application/json`
- `X-Webhook-Signature`: `sha256=<hmac_digest>` (for verification)
- `X-Webhook-Event`: Event type (e.g., `session.completed`)
- `X-Webhook-Delivery-Timestamp`: ISO 8601 timestamp
- `User-Agent`: `Sokudo-Webhooks/1.0`

**Access headers in n8n:** `{{ $json.headers['x-webhook-event'] }}`

## Retry Logic

Sokudo automatically retries failed webhook deliveries:
- **Attempts**: 3 total attempts
- **Delays**: Immediate, 5 seconds, 30 seconds
- **Timeout**: 10 seconds per delivery
- **Success**: HTTP 2xx status code

**n8n Best Practice:** Always respond with 200 OK immediately, even if processing fails. Use n8n's error handling to retry internally.

## Rate Limits

API endpoints have the following rate limits:

- **Webhook creation**: 10 requests/minute
- **Webhook listing**: 60 requests/minute
- **Webhook testing**: 5 requests/minute
- **User stats**: 60 requests/minute
- **Recent sessions**: 60 requests/minute

**n8n Tip:** Use **Rate Limit** node or **Wait** node to respect limits in scheduled workflows.

## Security Best Practices

1. **Always verify webhook signatures** using the Function node pattern above
2. **Store secrets in n8n Credentials**, not directly in workflows
3. **Use HTTPS URLs** for webhook endpoints (required for production)
4. **Create dedicated API keys** with minimal required scopes (read vs write vs *)
5. **Set expiration dates** on API keys for added security
6. **Rotate secrets periodically** by creating new webhooks/API keys
7. **Use n8n's IP allowlisting** if your Sokudo instance supports it
8. **Monitor webhook deliveries** in Sokudo's webhook logs
9. **Implement error handling** in n8n workflows to prevent workflow failures
10. **Use environment variables** for different environments (dev/staging/prod)

## n8n Credential Management

### Recommended Credential Setup

1. **Sokudo Webhook Secret**
   - Type: Generic Credential
   - Fields: `webhook_secret` (string)
   - Usage: Signature verification in Function nodes

2. **Sokudo API Key**
   - Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer sk_your_key_here`
   - Usage: HTTP Request nodes

3. **Environment Variables** (n8n.cloud or self-hosted)
   ```bash
   export SOKUDO_API_BASE_URL=https://yourdomain.com
   export SOKUDO_WEBHOOK_SECRET=whsec_...
   export SOKUDO_API_KEY=sk_...
   ```

## Troubleshooting

### Webhook not receiving data in n8n

1. **Check webhook is active** in Sokudo settings
2. **Verify the URL is correct** and matches n8n's Production Webhook URL
3. **Test using the Test Webhook button** in Sokudo
4. **Check n8n execution logs** (Settings > Executions)
5. **Ensure n8n workflow is active** (toggle in top-right)
6. **Verify firewall rules** allow incoming connections to n8n
7. **Check n8n's webhook path** is unique and not conflicting

### Signature verification failing

1. **Ensure you're using the exact webhook secret** from Sokudo
2. **Verify you're hashing the raw JSON payload** (stringify with no formatting)
3. **Use HMAC-SHA256** algorithm
4. **Prepend "sha256=" to the hex digest**
5. **Compare as strings** (case-sensitive)
6. **Check header name** is lowercase: `x-webhook-signature`

Example correct implementation:
```javascript
const crypto = require('crypto');
const signature = $input.item.headers['x-webhook-signature'];
const secret = 'whsec_...'; // Your exact secret
const payload = JSON.stringify($input.item.json); // Exact JSON as received

const expected = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid signature');
}
```

### API requests failing

1. **Verify API key is valid** and not expired in Sokudo settings
2. **Check the key has correct scopes** (read/write/*)
3. **Ensure Authorization header format**: `Bearer sk_...` (note the space)
4. **Check you're not exceeding rate limits** (add Wait nodes if needed)
5. **Review HTTP Request node response** for error messages
6. **Verify base URL** is correct (http vs https, port number)
7. **Test API endpoint** using curl or Postman first

### n8n workflow execution errors

1. **Check n8n logs** (Settings > Executions > Click on failed execution)
2. **Verify node connections** are correct
3. **Test each node individually** using "Execute Node" button
4. **Check data paths** (use `{{ $json }}` to see full payload)
5. **Validate JSON structure** matches expected format
6. **Add error handling** nodes (Error Trigger)

### Webhook deliveries failing in Sokudo

1. **Check Sokudo webhook delivery logs** (Dashboard > Webhooks > View Deliveries)
2. **Verify n8n instance is reachable** from Sokudo server
3. **Check HTTP status codes** in delivery logs
4. **Ensure n8n returns 200 OK** within 10 seconds
5. **Review n8n execution logs** for any errors during webhook processing

## Self-Hosted n8n Considerations

### Installation Options

1. **Docker Compose** (recommended)
2. **npm install** (local development)
3. **Kubernetes** (production scale)

### Webhook URL Format

For self-hosted n8n:
```
https://n8n.yourdomain.com/webhook/sokudo-events
```

For n8n.cloud:
```
https://your-instance.app.n8n.cloud/webhook/sokudo-events
```

### Reverse Proxy Configuration

If using nginx or Traefik:

```nginx
location /webhook/ {
    proxy_pass http://n8n:5678;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Database Recommendations

For production n8n:
- **PostgreSQL** (recommended for reliability)
- **MySQL/MariaDB** (alternative)
- Avoid SQLite for production (file locking issues)

## Comparison: n8n vs Zapier

| Feature | n8n | Zapier |
|---------|-----|--------|
| **Hosting** | Self-hosted or cloud | Cloud only |
| **Pricing** | Free (self-hosted) or $20+/mo | $20+/mo |
| **Data Privacy** | Full control | Cloud-hosted |
| **Custom Code** | JavaScript (Function nodes) | Python/JavaScript |
| **Debugging** | Full execution logs | Limited logs |
| **Integrations** | 400+ nodes | 5000+ apps |
| **Learning Curve** | Moderate | Easy |
| **Best For** | Developers, self-hosted | Non-technical users |

## Resources

### Official Documentation
- **n8n Docs**: https://docs.n8n.io
- **n8n Webhook Node**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- **n8n HTTP Request Node**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

### Community
- **n8n Community Forum**: https://community.n8n.io
- **n8n GitHub**: https://github.com/n8n-io/n8n
- **n8n Discord**: https://discord.gg/n8n

### Example Workflows
- Download ready-to-use Sokudo workflows: https://n8n.io/workflows (search "Sokudo")
- Import JSON workflow files directly into your n8n instance

## Support

For Sokudo-related issues:
- **Email**: support@sokudo.app
- **Documentation**: https://docs.sokudo.app
- **GitHub**: https://github.com/yourusername/sokudo

For n8n-related issues:
- **n8n Community Forum**: https://community.n8n.io
- **n8n Documentation**: https://docs.n8n.io

## Changelog

### 2026-02-05
- Initial n8n integration guide
- Added webhook setup instructions
- Added signature verification examples
- Added 7 example workflow templates
- Added troubleshooting section
- Added self-hosted n8n considerations

## Example: Complete Workflow JSON

Here's a complete n8n workflow that logs sessions to PostgreSQL with signature verification:

```json
{
  "name": "Sokudo Session Logger",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "sokudo-sessions",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "functionCode": "const crypto = require('crypto');\nconst signature = $input.item.headers['x-webhook-signature'];\nconst secret = $credentials.sokudo.webhook_secret;\nconst payload = JSON.stringify($input.item.json);\n\nconst expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');\n\nif (signature !== expected) {\n  throw new Error('Invalid webhook signature');\n}\n\nreturn $input.item.json;"
      },
      "name": "Verify Signature",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "sokudo": {
          "id": "1",
          "name": "Sokudo Webhook Secret"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO typing_sessions (timestamp, wpm, accuracy, duration_seconds) VALUES ('{{ $json.timestamp }}', {{ $json.data.wpm }}, {{ $json.data.accuracy }}, {{ $json.data.durationMs / 1000 }})",
        "options": {}
      },
      "name": "PostgreSQL",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [650, 300],
      "credentials": {
        "postgres": {
          "id": "2",
          "name": "My PostgreSQL"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\"success\": true}",
        "options": {
          "responseCode": 200
        }
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Verify Signature",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verify Signature": {
      "main": [
        [
          {
            "node": "PostgreSQL",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PostgreSQL": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

**To import this workflow:**
1. Copy the JSON above
2. In n8n, go to Workflows > Import from URL or File
3. Paste the JSON
4. Configure your PostgreSQL and Sokudo credentials
5. Activate the workflow
6. Copy the webhook URL and add it to Sokudo
