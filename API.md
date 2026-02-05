# Sokudo API Documentation

## Overview

The Sokudo API provides programmatic access to the typing trainer platform. Build integrations, analyze your typing performance, and automate your practice sessions.

## Getting Started

### 1. Get an API Key

1. Sign in to your Sokudo account
2. Navigate to Settings → API Keys
3. Click "Create New API Key"
4. Choose appropriate scopes (`read` for read-only, `write` for full access)
5. Copy your API key immediately (it won't be shown again)

### 2. Make Your First Request

```bash
curl https://api.sokudo.dev/api/v1/user \
  -H "X-API-Key: your_api_key_here"
```

## Authentication

All API requests require authentication using an API key in the `X-API-Key` header:

```bash
curl https://api.sokudo.dev/api/v1/stats \
  -H "X-API-Key: sk_live_abc123def456"
```

### API Key Scopes

- `read` - Read-only access to your data
- `write` - Create and modify resources
- `*` - Full access (read + write)

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- Most endpoints: 60 requests per minute
- Stats endpoint: 30 requests per minute
- Key creation: 5 requests per minute
- Session creation: 20 requests per minute

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1234567890
```

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## Interactive Documentation

Visit the interactive Swagger UI documentation:

- **Development:** http://localhost:3000/api/docs
- **Production:** https://api.sokudo.dev/api/docs

The interactive docs allow you to:
- Explore all available endpoints
- Try API calls directly from your browser
- See request/response schemas
- Test authentication

## Download OpenAPI Spec

Get the complete OpenAPI specification:

```bash
# YAML format
curl https://api.sokudo.dev/api/docs?format=yaml > openapi.yaml

# Alternative: Direct file
curl https://raw.githubusercontent.com/yourusername/sokudo/main/openapi.yaml
```

## Common Use Cases

### Track Your Progress

Fetch your stats and visualize your improvement:

```bash
curl https://api.sokudo.dev/api/v1/stats?trendDays=30 \
  -H "X-API-Key: your_api_key_here"
```

### Submit Practice Sessions

Programmatically submit typing sessions (requires `write` scope):

```bash
curl -X POST https://api.sokudo.dev/api/v1/sessions \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": 42,
    "wpm": 65,
    "rawWpm": 70,
    "accuracy": 95,
    "keystrokes": 250,
    "errors": 12,
    "durationMs": 45000
  }'
```

### Get Challenges

Retrieve typing challenges by category:

```bash
curl "https://api.sokudo.dev/api/v1/challenges?categorySlug=git-basics&difficulty=beginner" \
  -H "X-API-Key: your_api_key_here"
```

### Webhooks

Subscribe to events like session completions:

```bash
curl -X POST https://api.sokudo.dev/api/v1/webhooks \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["session.completed"],
    "description": "Production webhook"
  }'
```

## Webhook Events

Webhooks deliver events to your endpoint via HTTP POST:

### Event Types

- `session.completed` - Fired when a typing session is completed
- `achievement.earned` - Fired when a user earns an achievement

### Webhook Payload Format

```json
{
  "event": "session.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "sessionId": 123,
    "challengeId": 42,
    "wpm": 65,
    "accuracy": 95,
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Verifying Webhook Signatures

Webhooks include a signature in the `X-Webhook-Signature` header. Verify it using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

Error responses include a message:

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "field": "page",
      "message": "Must be a positive integer"
    }
  ]
}
```

## Pagination

List endpoints support pagination:

```bash
curl "https://api.sokudo.dev/api/v1/sessions?page=2&limit=50" \
  -H "X-API-Key: your_api_key_here"
```

Response includes pagination metadata:

```json
{
  "sessions": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

## Best Practices

1. **Store API keys securely** - Never commit keys to version control
2. **Use environment variables** - Store keys in `.env` files
3. **Implement retry logic** - Handle rate limits with exponential backoff
4. **Cache responses** - Reduce API calls by caching data when appropriate
5. **Use webhooks** - Subscribe to events instead of polling
6. **Handle errors gracefully** - Check status codes and parse error messages

## Example Integrations

### Node.js

```javascript
const fetch = require('node-fetch');

async function getUserStats() {
  const response = await fetch('https://api.sokudo.dev/api/v1/stats', {
    headers: {
      'X-API-Key': process.env.SOKUDO_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}
```

### Python

```python
import requests
import os

def get_user_stats():
    response = requests.get(
        'https://api.sokudo.dev/api/v1/stats',
        headers={'X-API-Key': os.environ['SOKUDO_API_KEY']}
    )
    response.raise_for_status()
    return response.json()
```

### Go

```go
package main

import (
    "encoding/json"
    "net/http"
    "os"
)

func getUserStats() (map[string]interface{}, error) {
    req, _ := http.NewRequest("GET", "https://api.sokudo.dev/api/v1/stats", nil)
    req.Header.Add("X-API-Key", os.Getenv("SOKUDO_API_KEY"))

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}
```

## Support

- **Issues:** https://github.com/yourusername/sokudo/issues
- **Documentation:** https://api.sokudo.dev/api/docs
- **Email:** support@sokudo.dev

## Changelog

### v1.0.0 (2024-01-15)

- Initial API release
- User profile endpoints
- Challenges and categories
- Session tracking
- Statistics and leaderboard
- Webhooks support
- API key management
