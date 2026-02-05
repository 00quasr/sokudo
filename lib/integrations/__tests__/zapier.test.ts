import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import {
  verifyZapierWebhookSignature,
  generateZapierVerificationCode,
  generateZapierTriggerConfig,
  generateZapierApiRequestConfig,
  zapierEventFilters,
  zapierDataPaths,
  validateZapierWebhookPayload,
  formatWebhookForZapier,
  generateZapierAuthConfig,
  generateZapierExamples,
  generateZapierSampleData,
  generateZapierAppDefinition,
} from '../zapier';

describe('Zapier Integration Utilities', () => {
  describe('verifyZapierWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyZapierWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const invalidSignature = 'sha256=invalid_signature_here';

      const result = verifyZapierWebhookSignature(invalidSignature, payload, secret);
      expect(result).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const correctSecret = 'whsec_correct_secret';
      const wrongSecret = 'whsec_wrong_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', correctSecret).update(payload).digest('hex');

      const result = verifyZapierWebhookSignature(signature, payload, wrongSecret);
      expect(result).toBe(false);
    });

    it('should handle complex payload correctly', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: {
          sessionId: 123,
          wpm: 85,
          accuracy: 95,
          keystrokes: 250,
          errors: 12,
          durationMs: 60000,
        },
      });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyZapierWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should be case-sensitive for signature comparison', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test' });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const uppercaseSignature = signature.toUpperCase();

      const result = verifyZapierWebhookSignature(uppercaseSignature, payload, secret);
      expect(result).toBe(false);
    });
  });

  describe('generateZapierVerificationCode', () => {
    it('should generate valid JavaScript code', () => {
      const code = generateZapierVerificationCode();

      expect(code).toContain('const crypto = require(\'crypto\')');
      expect(code).toContain('X-Webhook-Signature');
      expect(code).toContain('createHmac');
      expect(code).toContain('sha256');
      expect(code).toContain('throw new Error');
    });

    it('should include Zapier-specific variable access patterns', () => {
      const code = generateZapierVerificationCode();

      expect(code).toContain('inputData.headers');
      expect(code).toContain('inputData.body');
      expect(code).toContain('StoreClient.getSecret');
    });

    it('should include security error message', () => {
      const code = generateZapierVerificationCode();

      expect(code).toContain('Invalid webhook signature');
      expect(code).toContain('unauthorized');
    });

    it('should return verified data structure', () => {
      const code = generateZapierVerificationCode();

      expect(code).toContain('output = {');
      expect(code).toContain('verified: true');
      expect(code).toContain('event:');
      expect(code).toContain('data:');
    });
  });

  describe('generateZapierTriggerConfig', () => {
    it('should generate valid trigger configuration', () => {
      const config = generateZapierTriggerConfig() as any;

      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('key');
      expect(config).toHaveProperty('type');
      expect(config.type).toBe('hook');
    });

    it('should include input fields for webhook configuration', () => {
      const config = generateZapierTriggerConfig() as any;

      expect(config.operation.inputFields).toBeInstanceOf(Array);
      expect(config.operation.inputFields.length).toBeGreaterThan(0);
    });

    it('should have webhook secret field', () => {
      const config = generateZapierTriggerConfig() as any;
      const secretField = config.operation.inputFields.find(
        (f: any) => f.key === 'webhook_secret'
      );

      expect(secretField).toBeDefined();
      expect(secretField.required).toBe(true);
      expect(secretField.type).toBe('string');
    });

    it('should have event types field with choices', () => {
      const config = generateZapierTriggerConfig() as any;
      const eventField = config.operation.inputFields.find(
        (f: any) => f.key === 'event_types'
      );

      expect(eventField).toBeDefined();
      expect(eventField.list).toBe(true);
      expect(eventField.choices).toBeInstanceOf(Array);
      expect(eventField.choices.length).toBeGreaterThan(0);
    });

    it('should include sample data', () => {
      const config = generateZapierTriggerConfig() as any;

      expect(config.operation.sample).toBeDefined();
      expect(config.operation.sample.event).toBeDefined();
      expect(config.operation.sample.timestamp).toBeDefined();
      expect(config.operation.sample.data).toBeDefined();
    });

    it('should use custom event type when provided', () => {
      const config = generateZapierTriggerConfig('achievement.earned') as any;

      expect(config.operation.sample.event).toBe('achievement.earned');
    });

    it('should default to session.completed event', () => {
      const config = generateZapierTriggerConfig() as any;

      expect(config.operation.sample.event).toBe('session.completed');
    });
  });

  describe('generateZapierApiRequestConfig', () => {
    it('should generate valid API request config for GET', () => {
      const config = generateZapierApiRequestConfig('/user/stats', 'GET') as any;

      expect(config.method).toBe('GET');
      expect(config.url).toContain('/api/v1/user/stats');
    });

    it('should default to GET method', () => {
      const config = generateZapierApiRequestConfig('/user/stats') as any;

      expect(config.method).toBe('GET');
    });

    it('should support POST method', () => {
      const config = generateZapierApiRequestConfig('/webhooks', 'POST') as any;

      expect(config.method).toBe('POST');
    });

    it('should support PATCH method', () => {
      const config = generateZapierApiRequestConfig('/user', 'PATCH') as any;

      expect(config.method).toBe('PATCH');
    });

    it('should support DELETE method', () => {
      const config = generateZapierApiRequestConfig('/webhooks/123', 'DELETE') as any;

      expect(config.method).toBe('DELETE');
    });

    it('should include authorization header', () => {
      const config = generateZapierApiRequestConfig('/user/stats') as any;

      expect(config.headers.Authorization).toContain('Bearer');
      expect(config.headers.Authorization).toContain('bundle.authData.api_key');
    });

    it('should include content-type header', () => {
      const config = generateZapierApiRequestConfig('/user/stats') as any;

      expect(config.headers['Content-Type']).toBe('application/json');
    });

    it('should use Zapier bundle variable for base URL', () => {
      const config = generateZapierApiRequestConfig('/user/stats') as any;

      expect(config.url).toContain('bundle.authData.api_base_url');
    });

    it('should include body data for POST requests', () => {
      const bodyData = { name: 'Test Webhook', events: ['session.completed'] };
      const config = generateZapierApiRequestConfig(
        '/webhooks',
        'POST',
        bodyData
      ) as any;

      expect(config.body).toEqual(bodyData);
    });

    it('should include body data for PATCH requests', () => {
      const bodyData = { name: 'Updated Name' };
      const config = generateZapierApiRequestConfig(
        '/user',
        'PATCH',
        bodyData
      ) as any;

      expect(config.body).toEqual(bodyData);
    });

    it('should not include body for GET requests', () => {
      const bodyData = { test: 'data' };
      const config = generateZapierApiRequestConfig(
        '/user/stats',
        'GET',
        bodyData
      ) as any;

      expect(config.body).toBeUndefined();
    });
  });

  describe('zapierEventFilters', () => {
    it('should provide filters for all event types', () => {
      expect(zapierEventFilters.sessionCompleted).toBeDefined();
      expect(zapierEventFilters.achievementEarned).toBeDefined();
      expect(zapierEventFilters.userSignedUp).toBeDefined();
      expect(zapierEventFilters.subscriptionUpdated).toBeDefined();
      expect(zapierEventFilters.milestoneReached).toBeDefined();
    });

    it('should have consistent filter structure', () => {
      Object.values(zapierEventFilters).forEach((filter) => {
        expect(filter).toHaveProperty('field');
        expect(filter).toHaveProperty('operator');
        expect(filter).toHaveProperty('value');
      });
    });

    it('should use equals operator for event type filters', () => {
      expect(zapierEventFilters.sessionCompleted.operator).toBe('equals');
      expect(zapierEventFilters.achievementEarned.operator).toBe('equals');
    });

    it('should include WPM and accuracy filters', () => {
      expect(zapierEventFilters.highWpmSession.field).toBe('data__wpm');
      expect(zapierEventFilters.highWpmSession.operator).toBe('greater_than');
      expect(zapierEventFilters.highWpmSession.value).toBe(100);

      expect(zapierEventFilters.lowAccuracy.field).toBe('data__accuracy');
      expect(zapierEventFilters.lowAccuracy.operator).toBe('less_than');
      expect(zapierEventFilters.lowAccuracy.value).toBe(80);
    });

    it('should include milestone-specific filters', () => {
      expect(zapierEventFilters.wpmMilestone.field).toBe('data__milestoneType');
      expect(zapierEventFilters.wpmOver100.field).toBe('data__milestoneValue');
      expect(zapierEventFilters.wpmOver100.operator).toBe('greater_than_or_equal');
    });
  });

  describe('zapierDataPaths', () => {
    it('should provide access paths for session data', () => {
      expect(zapierDataPaths.sessionWpm).toBe('data.wpm');
      expect(zapierDataPaths.sessionAccuracy).toBe('data.accuracy');
      expect(zapierDataPaths.sessionDuration).toBe('data.durationMs');
    });

    it('should provide calculated duration in seconds', () => {
      expect(zapierDataPaths.sessionDurationSeconds).toContain('/ 1000');
    });

    it('should provide achievement data paths', () => {
      expect(zapierDataPaths.achievementName).toBe('data.name');
      expect(zapierDataPaths.achievementIcon).toBe('data.icon');
      expect(zapierDataPaths.achievementDescription).toBe('data.description');
    });

    it('should provide user data paths', () => {
      expect(zapierDataPaths.userEmail).toBe('data.email');
      expect(zapierDataPaths.userId).toBe('data.userId');
    });

    it('should provide milestone data paths', () => {
      expect(zapierDataPaths.milestoneValue).toBe('data.milestoneValue');
      expect(zapierDataPaths.milestoneType).toBe('data.milestoneType');
      expect(zapierDataPaths.currentWpm).toBe('data.currentWpm');
    });

    it('should provide common data paths', () => {
      expect(zapierDataPaths.eventType).toBe('event');
      expect(zapierDataPaths.timestamp).toBe('timestamp');
    });
  });

  describe('validateZapierWebhookPayload', () => {
    it('should validate correct payload structure', () => {
      const payload = {
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: { wpm: 85 },
      };

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing event field', () => {
      const payload = {
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "event" field');
    });

    it('should detect missing timestamp field', () => {
      const payload = {
        event: 'test',
        data: {},
      };

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "timestamp" field');
    });

    it('should detect missing data field', () => {
      const payload = {
        event: 'test',
        timestamp: '2024-02-05T10:30:00Z',
      };

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "data" field');
    });

    it('should reject invalid field types', () => {
      const payload = {
        event: 123, // Should be string
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it('should collect multiple errors', () => {
      const payload = {};

      const result = validateZapierWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should reject null payload', () => {
      const result = validateZapierWebhookPayload(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('null');
    });

    it('should reject undefined payload', () => {
      const result = validateZapierWebhookPayload(undefined);
      expect(result.valid).toBe(false);
    });

    it('should reject non-object payload', () => {
      const result = validateZapierWebhookPayload('string payload');
      expect(result.valid).toBe(false);
    });
  });

  describe('formatWebhookForZapier', () => {
    it('should format session completed event', () => {
      const payload = {
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: { wpm: 85, accuracy: 95, keystrokes: 250, errors: 12 },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toContain('85 WPM');
      expect(result).toContain('95% accuracy');
      expect(result).toContain('250 keystrokes');
      expect(result).toContain('12 errors');
    });

    it('should format achievement earned event', () => {
      const payload = {
        event: 'achievement.earned',
        timestamp: '2024-02-05T10:30:00Z',
        data: {
          icon: '🚀',
          name: 'Speed Demon',
          description: 'Type 100 WPM',
        },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toContain('🚀');
      expect(result).toContain('Speed Demon');
      expect(result).toContain('Type 100 WPM');
    });

    it('should format user signed up event', () => {
      const payload = {
        event: 'user.signed_up',
        timestamp: '2024-02-05T10:30:00Z',
        data: { email: 'test@example.com' },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toContain('test@example.com');
      expect(result).toContain('signed up');
    });

    it('should format subscription updated event', () => {
      const payload = {
        event: 'user.subscription_updated',
        timestamp: '2024-02-05T10:30:00Z',
        data: { planName: 'Pro Plan', status: 'active' },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toContain('Pro Plan');
      expect(result).toContain('active');
    });

    it('should format milestone reached event', () => {
      const payload = {
        event: 'user.milestone_reached',
        timestamp: '2024-02-05T10:30:00Z',
        data: { milestoneValue: 100, milestoneType: 'wpm' },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toContain('100');
      expect(result).toContain('WPM');
    });

    it('should include timestamp in output', () => {
      const payload = {
        event: 'test',
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toMatch(/\[.*\]/);
    });

    it('should handle unknown event types gracefully', () => {
      const payload = {
        event: 'unknown.event',
        timestamp: '2024-02-05T10:30:00Z',
        data: { custom: 'data' },
      };

      const result = formatWebhookForZapier(payload);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateZapierAuthConfig', () => {
    it('should generate authentication configuration', () => {
      const config = generateZapierAuthConfig() as any;

      expect(config.type).toBe('custom');
      expect(config.fields).toBeInstanceOf(Array);
    });

    it('should include API key field', () => {
      const config = generateZapierAuthConfig() as any;
      const apiKeyField = config.fields.find((f: any) => f.key === 'api_key');

      expect(apiKeyField).toBeDefined();
      expect(apiKeyField.required).toBe(true);
      expect(apiKeyField.type).toBe('string');
    });

    it('should include API base URL field', () => {
      const config = generateZapierAuthConfig() as any;
      const baseUrlField = config.fields.find((f: any) => f.key === 'api_base_url');

      expect(baseUrlField).toBeDefined();
      expect(baseUrlField.default).toBe('https://sokudo.dev');
    });

    it('should include test configuration', () => {
      const config = generateZapierAuthConfig() as any;

      expect(config.test).toBeDefined();
      expect(config.test.url).toContain('/api/v1/user');
      expect(config.test.method).toBe('GET');
      expect(config.test.headers.Authorization).toContain('Bearer');
    });

    it('should include connection label', () => {
      const config = generateZapierAuthConfig() as any;

      expect(config.connectionLabel).toBeDefined();
    });
  });

  describe('generateZapierExamples', () => {
    it('should generate example Zap templates', () => {
      const examples = generateZapierExamples();

      expect(examples).toHaveProperty('slackNotification');
      expect(examples).toHaveProperty('achievementToNotion');
      expect(examples).toHaveProperty('emailReport');
      expect(examples).toHaveProperty('googleSheets');
    });

    it('should include complete Zap configuration for Slack', () => {
      const examples = generateZapierExamples();
      const slack = examples.slackNotification;

      expect(slack.name).toBeDefined();
      expect(slack.description).toBeDefined();
      expect(slack.steps).toBeInstanceOf(Array);
      expect(slack.steps.length).toBeGreaterThan(0);
    });

    it('should include filter step in Slack example', () => {
      const examples = generateZapierExamples();
      const slack = examples.slackNotification;
      const filterStep = slack.steps.find((s: any) => s.app === 'Filter');

      expect(filterStep).toBeDefined();
      expect(filterStep.config).toBeDefined();
    });

    it('should include complete Zap configuration for Notion', () => {
      const examples = generateZapierExamples();
      const notion = examples.achievementToNotion;

      expect(notion.name).toBeDefined();
      expect(notion.steps).toBeInstanceOf(Array);
      expect(notion.steps.some((s: any) => s.app === 'Notion')).toBe(true);
    });

    it('should include complete Zap configuration for email', () => {
      const examples = generateZapierExamples();
      const email = examples.emailReport;

      expect(email.name).toBeDefined();
      expect(email.steps.some((s: any) => s.app === 'Schedule')).toBe(true);
      expect(email.steps.some((s: any) => s.app === 'Email')).toBe(true);
    });

    it('should include complete Zap configuration for Google Sheets', () => {
      const examples = generateZapierExamples();
      const sheets = examples.googleSheets;

      expect(sheets.name).toBeDefined();
      expect(sheets.steps.some((s: any) => s.app === 'Google Sheets')).toBe(true);
    });
  });

  describe('generateZapierSampleData', () => {
    it('should generate sample data for all event types', () => {
      const samples = generateZapierSampleData();

      expect(samples).toHaveProperty('session.completed');
      expect(samples).toHaveProperty('achievement.earned');
      expect(samples).toHaveProperty('user.signed_up');
      expect(samples).toHaveProperty('user.subscription_updated');
      expect(samples).toHaveProperty('user.milestone_reached');
    });

    it('should include valid session completed sample', () => {
      const samples = generateZapierSampleData();
      const session = samples['session.completed'];

      expect(session.event).toBe('session.completed');
      expect(session.data.wpm).toBeDefined();
      expect(session.data.accuracy).toBeDefined();
      expect(session.data.keystrokes).toBeDefined();
    });

    it('should include valid achievement earned sample', () => {
      const samples = generateZapierSampleData();
      const achievement = samples['achievement.earned'];

      expect(achievement.event).toBe('achievement.earned');
      expect(achievement.data.name).toBeDefined();
      expect(achievement.data.icon).toBeDefined();
    });

    it('should include valid user signed up sample', () => {
      const samples = generateZapierSampleData();
      const signup = samples['user.signed_up'];

      expect(signup.event).toBe('user.signed_up');
      expect(signup.data.email).toBeDefined();
    });

    it('should include valid subscription updated sample', () => {
      const samples = generateZapierSampleData();
      const subscription = samples['user.subscription_updated'];

      expect(subscription.event).toBe('user.subscription_updated');
      expect(subscription.data.planName).toBeDefined();
      expect(subscription.data.status).toBeDefined();
    });

    it('should include valid milestone reached sample', () => {
      const samples = generateZapierSampleData();
      const milestone = samples['user.milestone_reached'];

      expect(milestone.event).toBe('user.milestone_reached');
      expect(milestone.data.milestoneType).toBeDefined();
      expect(milestone.data.milestoneValue).toBeDefined();
    });

    it('should include timestamps in all samples', () => {
      const samples = generateZapierSampleData();

      Object.values(samples).forEach((sample) => {
        expect(sample.timestamp).toBeDefined();
        expect(typeof sample.timestamp).toBe('string');
      });
    });
  });

  describe('generateZapierAppDefinition', () => {
    it('should generate complete app definition', () => {
      const app = generateZapierAppDefinition() as any;

      expect(app.version).toBeDefined();
      expect(app.platformVersion).toBeDefined();
      expect(app.authentication).toBeDefined();
      expect(app.triggers).toBeDefined();
      expect(app.searches).toBeDefined();
      expect(app.creates).toBeDefined();
    });

    it('should include trigger definitions', () => {
      const app = generateZapierAppDefinition() as any;

      expect(app.triggers.new_session).toBeDefined();
      expect(app.triggers.new_achievement).toBeDefined();
    });

    it('should include search definitions', () => {
      const app = generateZapierAppDefinition() as any;

      expect(app.searches.get_user_stats).toBeDefined();
      expect(app.searches.get_user_stats.operation).toBeDefined();
    });

    it('should include create definitions', () => {
      const app = generateZapierAppDefinition() as any;

      expect(app.creates.create_webhook).toBeDefined();
      expect(app.creates.create_webhook.operation).toBeDefined();
    });

    it('should use proper Zapier platform version', () => {
      const app = generateZapierAppDefinition() as any;

      expect(app.platformVersion).toBe('15.0.0');
    });
  });

  describe('Integration with existing webhook system', () => {
    it('should use same signature algorithm as webhook delivery', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });

      // Simulate signature from webhook delivery system
      const deliverySignature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      // Verify using Zapier utility
      const verified = verifyZapierWebhookSignature(
        deliverySignature,
        payload,
        secret
      );

      expect(verified).toBe(true);
    });

    it('should validate all webhook event types', () => {
      const events = [
        'session.completed',
        'achievement.earned',
        'user.signed_up',
        'user.subscription_updated',
        'user.milestone_reached',
      ];

      events.forEach((event) => {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data: {},
        };

        const result = validateZapierWebhookPayload(payload);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty payload in signature verification', () => {
      const secret = 'whsec_test';
      const payload = '';
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyZapierWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should handle special characters in payload', () => {
      const secret = 'whsec_test';
      const payload = JSON.stringify({
        event: 'test',
        data: { message: 'Hello "world" & friends! 🚀' },
      });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyZapierWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should handle malformed JSON in formatWebhookForZapier', () => {
      const malformedPayload = {
        event: 'test',
        timestamp: 'invalid-date',
        data: {},
      };

      expect(() => formatWebhookForZapier(malformedPayload)).not.toThrow();
    });

    it('should handle missing data fields gracefully in formatters', () => {
      const payload = {
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      expect(() => formatWebhookForZapier(payload)).not.toThrow();
    });
  });

  describe('Zapier-specific features', () => {
    it('should support Zapier Storage pattern in verification code', () => {
      const code = generateZapierVerificationCode();

      expect(code).toContain('StoreClient.getSecret');
    });

    it('should use Zapier bundle variables in API requests', () => {
      const config = generateZapierApiRequestConfig('/user/stats') as any;

      expect(config.url).toContain('{{bundle.authData.api_base_url}}');
      expect(config.headers.Authorization).toContain('{{bundle.authData.api_key}}');
    });

    it('should provide filters in Zapier filter format', () => {
      const filter = zapierEventFilters.highWpmSession;

      expect(filter).toHaveProperty('field');
      expect(filter).toHaveProperty('operator');
      expect(filter).toHaveProperty('value');
      expect(typeof filter.operator).toBe('string');
    });

    it('should use Zapier data path notation', () => {
      expect(zapierDataPaths.sessionWpm).toBe('data.wpm');
      expect(zapierDataPaths.userEmail).toBe('data.email');
      expect(zapierDataPaths.eventType).toBe('event');
    });
  });
});
