/**
 * n8n Integration Utilities
 *
 * Helper functions for integrating Sokudo with n8n workflows.
 * These utilities are primarily for reference and can be used in n8n Function nodes.
 */

import * as crypto from 'crypto';

/**
 * Verify webhook signature for n8n Function nodes
 *
 * Use this function in an n8n Function node to verify webhook authenticity.
 *
 * @example
 * ```javascript
 * // In n8n Function node:
 * const crypto = require('crypto');
 * const signature = $input.item.headers['x-webhook-signature'];
 * const secret = $credentials.sokudo.webhook_secret;
 * const payload = JSON.stringify($input.item.json);
 *
 * const expected = 'sha256=' + crypto
 *   .createHmac('sha256', secret)
 *   .update(payload)
 *   .digest('hex');
 *
 * if (signature !== expected) {
 *   throw new Error('Invalid webhook signature');
 * }
 *
 * return $input.item.json;
 * ```
 */
export function verifyN8nWebhookSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return signature === expectedSignature;
}

/**
 * Generate example n8n Function node code for signature verification
 *
 * Returns JavaScript code that can be copied directly into an n8n Function node.
 */
export function generateN8nVerificationCode(): string {
  return `// Verify Sokudo webhook signature
const crypto = require('crypto');

// Get signature from headers (n8n provides headers in lowercase)
const signature = $input.item.headers['x-webhook-signature'];

// Get webhook secret from n8n credentials
// Alternative: hardcode for testing (not recommended for production)
const secret = $credentials.sokudo.webhook_secret;

// Stringify the JSON payload exactly as received
const payload = JSON.stringify($input.item.json);

// Calculate expected signature using HMAC-SHA256
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Verify signatures match
if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature - potential security issue');
}

// Signature is valid, pass through the webhook payload
return $input.item.json;`;
}

/**
 * Generate n8n workflow JSON for basic webhook receiver
 *
 * Creates a complete n8n workflow that receives Sokudo webhooks,
 * verifies signatures, and responds with 200 OK.
 */
export function generateN8nWorkflowJSON(webhookPath = 'sokudo-webhook'): object {
  return {
    name: 'Sokudo Webhook Receiver',
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: webhookPath,
          responseMode: 'responseNode',
          options: {},
        },
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
      },
      {
        parameters: {
          functionCode: generateN8nVerificationCode(),
        },
        name: 'Verify Signature',
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        position: [450, 300],
        credentials: {
          sokudo: {
            id: '1',
            name: 'Sokudo Webhook Secret',
          },
        },
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: '={{ $json.event }}',
                operation: 'equals',
                value2: 'session.completed',
              },
            ],
          },
        },
        name: 'Filter Event Type',
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        position: [650, 300],
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={"success": true, "event": "{{ $json.event }}"}',
          options: {
            responseCode: 200,
          },
        },
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        position: [850, 300],
      },
    ],
    connections: {
      Webhook: {
        main: [
          [
            {
              node: 'Verify Signature',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Verify Signature': {
        main: [
          [
            {
              node: 'Filter Event Type',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Filter Event Type': {
        main: [
          [
            {
              node: 'Respond to Webhook',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
  };
}

/**
 * Generate n8n HTTP Request configuration for Sokudo API
 *
 * Returns configuration object for n8n HTTP Request node to fetch data from Sokudo.
 */
export function generateN8nHttpRequestConfig(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET'
): object {
  return {
    parameters: {
      method,
      url: `={{ $env.SOKUDO_API_BASE_URL }}/api/v1${endpoint}`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: 'Authorization',
            value: '=Bearer {{ $credentials.sokudo_api.api_key }}',
          },
        ],
      },
      options: {},
    },
    name: 'Sokudo API Request',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 3,
  };
}

/**
 * n8n webhook event filters
 *
 * Common filter conditions for n8n IF nodes to route different webhook events.
 */
export const n8nEventFilters = {
  sessionCompleted: '={{ $json.event === "session.completed" }}',
  achievementEarned: '={{ $json.event === "achievement.earned" }}',
  userSignedUp: '={{ $json.event === "user.signed_up" }}',
  subscriptionUpdated: '={{ $json.event === "user.subscription_updated" }}',
  milestoneReached: '={{ $json.event === "user.milestone_reached" }}',

  // WPM filters
  highWpmSession: '={{ $json.data.wpm > 100 }}',
  lowAccuracy: '={{ $json.data.accuracy < 80 }}',

  // Milestone filters
  wpmMilestone: '={{ $json.data.milestoneType === "wpm" }}',
  wpmOver100: '={{ $json.data.milestoneValue >= 100 }}',
};

/**
 * n8n data access paths
 *
 * Common expressions for accessing webhook payload data in n8n nodes.
 */
export const n8nDataPaths = {
  // Session data
  sessionWpm: '{{ $json.data.wpm }}',
  sessionAccuracy: '{{ $json.data.accuracy }}',
  sessionDuration: '{{ $json.data.durationMs }}',
  sessionDurationSeconds: '{{ $json.data.durationMs / 1000 }}',
  sessionErrors: '{{ $json.data.errors }}',

  // Achievement data
  achievementName: '{{ $json.data.name }}',
  achievementIcon: '{{ $json.data.icon }}',
  achievementDescription: '{{ $json.data.description }}',

  // User data
  userEmail: '{{ $json.data.email }}',
  userId: '{{ $json.data.userId }}',

  // Milestone data
  milestoneValue: '{{ $json.data.milestoneValue }}',
  currentWpm: '{{ $json.data.currentWpm }}',

  // Common
  eventType: '{{ $json.event }}',
  timestamp: '{{ $json.timestamp }}',
};

/**
 * Validate n8n webhook payload structure
 *
 * Checks if the webhook payload has the expected structure.
 * Useful for testing and debugging.
 */
export function validateN8nWebhookPayload(payload: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if payload is null or undefined
  if (!payload || typeof payload !== 'object') {
    errors.push('Payload is null, undefined, or not an object');
    return {
      valid: false,
      errors,
    };
  }

  if (!payload.event || typeof payload.event !== 'string') {
    errors.push('Missing or invalid "event" field');
  }

  if (!payload.timestamp || typeof payload.timestamp !== 'string') {
    errors.push('Missing or invalid "timestamp" field');
  }

  if (!payload.data || typeof payload.data !== 'object') {
    errors.push('Missing or invalid "data" field');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format webhook payload for n8n display
 *
 * Creates a human-readable summary of the webhook payload
 * for use in notifications or logs.
 */
export function formatWebhookForN8n(payload: any): string {
  const { event, data, timestamp } = payload;

  const eventFormatters: Record<string, (data: any) => string> = {
    'session.completed': (d) =>
      `Session completed: ${d.wpm} WPM, ${d.accuracy}% accuracy`,
    'achievement.earned': (d) =>
      `Achievement earned: ${d.icon} ${d.name} - ${d.description}`,
    'user.signed_up': (d) => `New user signed up: ${d.email}`,
    'user.subscription_updated': (d) =>
      `Subscription updated: ${d.planName} (${d.status})`,
    'user.milestone_reached': (d) =>
      `Milestone reached: ${d.milestoneValue} ${d.milestoneType.toUpperCase()}`,
  };

  const formatter = eventFormatters[event] || ((d) => JSON.stringify(d, null, 2));
  const message = formatter(data);

  return `[${new Date(timestamp).toLocaleString()}] ${message}`;
}

/**
 * Generate n8n credential configuration
 *
 * Returns the structure for setting up Sokudo credentials in n8n.
 */
export function generateN8nCredentialSetup() {
  return {
    webhook_secret: {
      name: 'Sokudo Webhook Secret',
      type: 'sokudoWebhookSecret',
      data: {
        webhook_secret: 'whsec_your_secret_here',
      },
      description:
        'Webhook secret for verifying Sokudo webhook signatures. Get this from Sokudo Dashboard > Webhooks > Create Webhook.',
    },
    api_key: {
      name: 'Sokudo API Key',
      type: 'httpHeaderAuth',
      data: {
        name: 'Authorization',
        value: 'Bearer sk_your_api_key_here',
      },
      description:
        'API key for accessing Sokudo REST API. Get this from Sokudo Dashboard > Settings > API Keys.',
    },
  };
}
