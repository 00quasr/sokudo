/**
 * Zapier Integration Utilities
 *
 * Helper functions for integrating Sokudo with Zapier workflows.
 * These utilities help Zapier users connect Sokudo webhooks and API endpoints.
 */

import * as crypto from 'crypto';

/**
 * Verify webhook signature for Zapier webhooks
 *
 * Use this function in a Zapier Code by Zapier action to verify webhook authenticity.
 *
 * @example
 * ```javascript
 * // In Zapier Code by Zapier (JavaScript):
 * const crypto = require('crypto');
 * const signature = inputData.headers['X-Webhook-Signature'];
 * const secret = inputData.secret; // From Zapier Storage or input field
 * const payload = JSON.stringify(inputData.body);
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
 * output = inputData.body;
 * ```
 */
export function verifyZapierWebhookSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return signature === expectedSignature;
}

/**
 * Generate example Zapier Code by Zapier snippet for signature verification
 *
 * Returns JavaScript code that can be copied directly into a Zapier Code action.
 */
export function generateZapierVerificationCode(): string {
  return `// Verify Sokudo webhook signature in Zapier
const crypto = require('crypto');

// Get signature from webhook headers
const signature = inputData.headers['X-Webhook-Signature'] || inputData.headers['x-webhook-signature'];

// Get webhook secret from Zapier Storage or input field
// Option 1: From Zapier Storage
const secret = await StoreClient.getSecret('sokudo_webhook_secret');
// Option 2: From previous step or input field
// const secret = inputData.webhook_secret;

// Get the raw webhook payload
const payload = JSON.stringify(inputData.body);

// Calculate expected signature using HMAC-SHA256
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Verify signatures match
if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature - webhook may be from unauthorized source');
}

// Signature is valid, return the webhook data
output = {
  verified: true,
  event: inputData.body.event,
  data: inputData.body.data,
  timestamp: inputData.body.timestamp
};`;
}

/**
 * Generate Zapier webhook trigger configuration
 *
 * Returns configuration object that can be used to document
 * how to set up a Zapier webhook trigger for Sokudo events.
 */
export function generateZapierTriggerConfig(eventType?: string): object {
  return {
    name: 'New Sokudo Event',
    key: 'new_sokudo_event',
    type: 'hook',
    operation: {
      inputFields: [
        {
          key: 'webhook_secret',
          label: 'Webhook Secret',
          type: 'string',
          required: true,
          helpText:
            'Get this from your Sokudo Dashboard under Settings > Webhooks. Format: whsec_...',
        },
        {
          key: 'event_types',
          label: 'Event Types',
          type: 'string',
          list: true,
          choices: [
            { value: 'session.completed', label: 'Session Completed' },
            { value: 'achievement.earned', label: 'Achievement Earned' },
            { value: 'user.signed_up', label: 'User Signed Up' },
            { value: 'user.subscription_updated', label: 'Subscription Updated' },
            { value: 'user.milestone_reached', label: 'Milestone Reached' },
          ],
          helpText: 'Select which events to receive from Sokudo',
        },
      ],
      sample: {
        event: eventType || 'session.completed',
        timestamp: new Date().toISOString(),
        data: {
          sessionId: 12345,
          userId: 1,
          wpm: 85,
          rawWpm: 90,
          accuracy: 95,
          keystrokes: 250,
          errors: 12,
          durationMs: 60000,
        },
      },
    },
  };
}

/**
 * Generate Zapier API request configuration
 *
 * Returns configuration for making authenticated requests to the Sokudo API in Zapier.
 */
export function generateZapierApiRequestConfig(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  bodyData?: Record<string, unknown>
): object {
  const config: Record<string, unknown> = {
    url: `{{bundle.authData.api_base_url}}/api/v1${endpoint}`,
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {{bundle.authData.api_key}}',
    },
  };

  if (bodyData && ['POST', 'PATCH'].includes(method)) {
    config.body = bodyData;
  }

  return config;
}

/**
 * Zapier webhook event filters
 *
 * Common filter conditions for Zapier Filter actions to route different webhook events.
 */
export const zapierEventFilters = {
  sessionCompleted: {
    field: 'event',
    operator: 'equals',
    value: 'session.completed',
  },
  achievementEarned: {
    field: 'event',
    operator: 'equals',
    value: 'achievement.earned',
  },
  userSignedUp: {
    field: 'event',
    operator: 'equals',
    value: 'user.signed_up',
  },
  subscriptionUpdated: {
    field: 'event',
    operator: 'equals',
    value: 'user.subscription_updated',
  },
  milestoneReached: {
    field: 'event',
    operator: 'equals',
    value: 'user.milestone_reached',
  },
  // WPM filters
  highWpmSession: {
    field: 'data__wpm',
    operator: 'greater_than',
    value: 100,
  },
  lowAccuracy: {
    field: 'data__accuracy',
    operator: 'less_than',
    value: 80,
  },
  // Milestone filters
  wpmMilestone: {
    field: 'data__milestoneType',
    operator: 'equals',
    value: 'wpm',
  },
  wpmOver100: {
    field: 'data__milestoneValue',
    operator: 'greater_than_or_equal',
    value: 100,
  },
};

/**
 * Zapier data mapping paths
 *
 * Common paths for accessing webhook payload data in Zapier actions.
 * Use these in Zapier's data mapping fields.
 */
export const zapierDataPaths = {
  // Session data
  sessionWpm: 'data.wpm',
  sessionAccuracy: 'data.accuracy',
  sessionDuration: 'data.durationMs',
  sessionDurationSeconds: '{{data.durationMs / 1000}}',
  sessionErrors: 'data.errors',
  sessionKeystrokes: 'data.keystrokes',
  sessionRawWpm: 'data.rawWpm',

  // Achievement data
  achievementName: 'data.name',
  achievementIcon: 'data.icon',
  achievementDescription: 'data.description',
  achievementSlug: 'data.slug',

  // User data
  userEmail: 'data.email',
  userId: 'data.userId',
  userName: 'data.name',

  // Milestone data
  milestoneValue: 'data.milestoneValue',
  milestoneType: 'data.milestoneType',
  currentWpm: 'data.currentWpm',

  // Common
  eventType: 'event',
  timestamp: 'timestamp',
};

/**
 * Validate Zapier webhook payload structure
 *
 * Checks if the webhook payload has the expected structure.
 * Useful for testing and debugging in Zapier.
 */
export function validateZapierWebhookPayload(payload: any): {
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
 * Format webhook payload for Zapier display
 *
 * Creates a human-readable summary of the webhook payload
 * for use in Zapier notifications, emails, or logs.
 */
export function formatWebhookForZapier(payload: any): string {
  const { event, data, timestamp } = payload;

  const eventFormatters: Record<string, (data: any) => string> = {
    'session.completed': (d) =>
      `Session completed: ${d.wpm} WPM, ${d.accuracy}% accuracy (${d.keystrokes} keystrokes, ${d.errors} errors)`,
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
 * Generate Zapier authentication configuration
 *
 * Returns the structure for setting up Sokudo authentication in Zapier.
 */
export function generateZapierAuthConfig() {
  return {
    type: 'custom',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'string',
        required: true,
        helpText:
          'Get your API key from Sokudo Dashboard > Settings > API Keys. Format: sk_...',
      },
      {
        key: 'api_base_url',
        label: 'API Base URL',
        type: 'string',
        default: 'https://sokudo.dev',
        required: false,
        helpText: 'Leave default unless using a self-hosted instance',
      },
    ],
    test: {
      url: '{{bundle.authData.api_base_url}}/api/v1/user',
      method: 'GET',
      headers: {
        Authorization: 'Bearer {{bundle.authData.api_key}}',
      },
    },
    connectionLabel: '{{bundle.authData.api_key}}',
  };
}

/**
 * Generate example Zapier Zap configurations
 *
 * Returns example Zap templates for common use cases.
 */
export function generateZapierExamples() {
  return {
    slackNotification: {
      name: 'Send Slack notification on high WPM session',
      description:
        'Get notified in Slack when you achieve a session with over 100 WPM',
      steps: [
        {
          app: 'Sokudo',
          action: 'Catch Hook',
          description: 'Receive webhook when session.completed event fires',
        },
        {
          app: 'Filter',
          action: 'Only continue if...',
          description: 'Filter for data.wpm > 100',
          config: zapierEventFilters.highWpmSession,
        },
        {
          app: 'Slack',
          action: 'Send Channel Message',
          description: 'Send message with session details',
          mapping: {
            channel: '#typing-practice',
            text: '🚀 New high score! {{data.wpm}} WPM with {{data.accuracy}}% accuracy',
          },
        },
      ],
    },
    achievementToNotion: {
      name: 'Log achievements to Notion database',
      description: 'Automatically log earned achievements to a Notion database',
      steps: [
        {
          app: 'Sokudo',
          action: 'Catch Hook',
          description: 'Receive webhook when achievement.earned event fires',
        },
        {
          app: 'Notion',
          action: 'Create Database Item',
          description: 'Create new row in Achievements database',
          mapping: {
            database_id: 'your_notion_database_id',
            name: '{{data.name}}',
            description: '{{data.description}}',
            icon: '{{data.icon}}',
            earned_at: '{{timestamp}}',
          },
        },
      ],
    },
    emailReport: {
      name: 'Send weekly practice report via email',
      description: 'Get a weekly summary of your typing practice',
      steps: [
        {
          app: 'Schedule',
          action: 'Every Week',
          description: 'Trigger every Monday at 9 AM',
        },
        {
          app: 'Sokudo',
          action: 'API Request',
          description: 'Fetch weekly statistics',
          config: generateZapierApiRequestConfig('/user/stats?period=week', 'GET'),
        },
        {
          app: 'Email',
          action: 'Send Outbound Email',
          description: 'Send formatted email with stats',
          mapping: {
            to: '{{user.email}}',
            subject: 'Your Weekly Typing Practice Report',
            body: 'This week: {{totalSessions}} sessions, {{avgWpm}} WPM average',
          },
        },
      ],
    },
    googleSheets: {
      name: 'Log sessions to Google Sheets',
      description: 'Track all typing sessions in a Google Sheet',
      steps: [
        {
          app: 'Sokudo',
          action: 'Catch Hook',
          description: 'Receive webhook when session.completed event fires',
        },
        {
          app: 'Google Sheets',
          action: 'Create Spreadsheet Row',
          description: 'Add new row with session data',
          mapping: {
            spreadsheet_id: 'your_sheet_id',
            worksheet_name: 'Sessions',
            values: {
              Date: '{{timestamp}}',
              WPM: '{{data.wpm}}',
              Accuracy: '{{data.accuracy}}',
              Duration: '{{data.durationMs / 1000}}',
              Errors: '{{data.errors}}',
            },
          },
        },
      ],
    },
  };
}

/**
 * Generate Zapier webhook sample data for testing
 *
 * Returns sample webhook payloads for each event type.
 */
export function generateZapierSampleData() {
  return {
    'session.completed': {
      event: 'session.completed',
      timestamp: new Date().toISOString(),
      data: {
        sessionId: 12345,
        userId: 1,
        challengeId: 42,
        categorySlug: 'git-basics',
        wpm: 85,
        rawWpm: 90,
        accuracy: 94.5,
        keystrokes: 250,
        errors: 12,
        durationMs: 60000,
        completedAt: new Date().toISOString(),
      },
    },
    'achievement.earned': {
      event: 'achievement.earned',
      timestamp: new Date().toISOString(),
      data: {
        achievementId: 5,
        slug: 'speed-demon-100',
        name: 'Speed Demon',
        description: 'Type at 100 WPM or higher',
        icon: '🚀',
        userId: 1,
        earnedAt: new Date().toISOString(),
      },
    },
    'user.signed_up': {
      event: 'user.signed_up',
      timestamp: new Date().toISOString(),
      data: {
        userId: 1,
        email: 'user@example.com',
        name: 'John Doe',
        signupMethod: 'email',
      },
    },
    'user.subscription_updated': {
      event: 'user.subscription_updated',
      timestamp: new Date().toISOString(),
      data: {
        userId: 1,
        planName: 'Pro Plan',
        status: 'active',
        priceId: 'price_123',
        subscriptionId: 'sub_123',
      },
    },
    'user.milestone_reached': {
      event: 'user.milestone_reached',
      timestamp: new Date().toISOString(),
      data: {
        userId: 1,
        milestoneType: 'wpm',
        milestoneValue: 100,
        currentWpm: 102,
        previousBest: 98,
      },
    },
  };
}

/**
 * Generate Zapier CLI app definition skeleton
 *
 * Returns a basic structure for creating a custom Zapier integration app.
 */
export function generateZapierAppDefinition() {
  return {
    version: '1.0.0',
    platformVersion: '15.0.0',
    authentication: generateZapierAuthConfig(),
    triggers: {
      new_session: {
        key: 'new_session',
        noun: 'Session',
        display: {
          label: 'New Session Completed',
          description: 'Triggers when a typing session is completed',
        },
        operation: generateZapierTriggerConfig('session.completed'),
      },
      new_achievement: {
        key: 'new_achievement',
        noun: 'Achievement',
        display: {
          label: 'New Achievement Earned',
          description: 'Triggers when an achievement is earned',
        },
        operation: generateZapierTriggerConfig('achievement.earned'),
      },
    },
    searches: {
      get_user_stats: {
        key: 'get_user_stats',
        noun: 'User Stats',
        display: {
          label: 'Get User Statistics',
          description: 'Retrieve typing statistics for the authenticated user',
        },
        operation: {
          perform: generateZapierApiRequestConfig('/user/stats', 'GET'),
        },
      },
    },
    creates: {
      create_webhook: {
        key: 'create_webhook',
        noun: 'Webhook',
        display: {
          label: 'Create Webhook',
          description: 'Register a new webhook endpoint',
        },
        operation: {
          perform: generateZapierApiRequestConfig('/webhooks', 'POST', {
            url: '{{bundle.targetUrl}}',
            events: '{{bundle.inputData.events}}',
          }),
        },
      },
    },
  };
}
