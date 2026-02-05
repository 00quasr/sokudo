import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import {
  verifyN8nWebhookSignature,
  generateN8nVerificationCode,
  generateN8nWorkflowJSON,
  generateN8nHttpRequestConfig,
  n8nEventFilters,
  n8nDataPaths,
  validateN8nWebhookPayload,
  formatWebhookForN8n,
  generateN8nCredentialSetup,
} from '../n8n';

describe('n8n Integration Utilities', () => {
  describe('verifyN8nWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const result = verifyN8nWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const invalidSignature = 'sha256=invalid_signature_here';

      const result = verifyN8nWebhookSignature(invalidSignature, payload, secret);
      expect(result).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const correctSecret = 'whsec_correct_secret';
      const wrongSecret = 'whsec_wrong_secret';
      const payload = JSON.stringify({ event: 'test', data: {} });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', correctSecret).update(payload).digest('hex');

      const result = verifyN8nWebhookSignature(signature, payload, wrongSecret);
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

      const result = verifyN8nWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should be case-sensitive for signature comparison', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ event: 'test' });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const uppercaseSignature = signature.toUpperCase();

      const result = verifyN8nWebhookSignature(uppercaseSignature, payload, secret);
      expect(result).toBe(false);
    });
  });

  describe('generateN8nVerificationCode', () => {
    it('should generate valid JavaScript code', () => {
      const code = generateN8nVerificationCode();

      expect(code).toContain('const crypto = require(\'crypto\')');
      expect(code).toContain('x-webhook-signature');
      expect(code).toContain('createHmac');
      expect(code).toContain('sha256');
      expect(code).toContain('throw new Error');
    });

    it('should include n8n-specific variable access patterns', () => {
      const code = generateN8nVerificationCode();

      expect(code).toContain('$input.item.headers');
      expect(code).toContain('$input.item.json');
      expect(code).toContain('$credentials.sokudo');
    });

    it('should include security error message', () => {
      const code = generateN8nVerificationCode();

      expect(code).toContain('Invalid webhook signature');
      expect(code).toContain('security');
    });
  });

  describe('generateN8nWorkflowJSON', () => {
    it('should generate valid n8n workflow structure', () => {
      const workflow = generateN8nWorkflowJSON();

      expect(workflow).toHaveProperty('name');
      expect(workflow).toHaveProperty('nodes');
      expect(workflow).toHaveProperty('connections');
    });

    it('should include required workflow nodes', () => {
      const workflow = generateN8nWorkflowJSON() as any;

      const nodeNames = workflow.nodes.map((n: any) => n.name);
      expect(nodeNames).toContain('Webhook');
      expect(nodeNames).toContain('Verify Signature');
      expect(nodeNames).toContain('Respond to Webhook');
    });

    it('should use custom webhook path when provided', () => {
      const customPath = 'custom-sokudo-webhook';
      const workflow = generateN8nWorkflowJSON(customPath) as any;

      const webhookNode = workflow.nodes.find((n: any) => n.name === 'Webhook');
      expect(webhookNode?.parameters?.path).toBe(customPath);
    });

    it('should configure POST method for webhook', () => {
      const workflow = generateN8nWorkflowJSON() as any;
      const webhookNode = workflow.nodes.find((n: any) => n.name === 'Webhook');

      expect(webhookNode?.parameters?.httpMethod).toBe('POST');
    });

    it('should include node connections', () => {
      const workflow = generateN8nWorkflowJSON() as any;

      expect(workflow.connections).toHaveProperty('Webhook');
      expect(workflow.connections).toHaveProperty('Verify Signature');
    });

    it('should position nodes correctly', () => {
      const workflow = generateN8nWorkflowJSON() as any;

      workflow.nodes.forEach((node: any) => {
        expect(node.position).toBeInstanceOf(Array);
        expect(node.position).toHaveLength(2);
        expect(typeof node.position[0]).toBe('number');
        expect(typeof node.position[1]).toBe('number');
      });
    });
  });

  describe('generateN8nHttpRequestConfig', () => {
    it('should generate valid HTTP request config for GET', () => {
      const config = generateN8nHttpRequestConfig('/user/stats', 'GET') as any;

      expect(config.parameters.method).toBe('GET');
      expect(config.parameters.url).toContain('/api/v1/user/stats');
      expect(config.name).toBe('Sokudo API Request');
    });

    it('should default to GET method', () => {
      const config = generateN8nHttpRequestConfig('/user/stats') as any;

      expect(config.parameters.method).toBe('GET');
    });

    it('should support POST method', () => {
      const config = generateN8nHttpRequestConfig('/webhooks', 'POST') as any;

      expect(config.parameters.method).toBe('POST');
    });

    it('should include authorization header configuration', () => {
      const config = generateN8nHttpRequestConfig('/user/stats') as any;

      expect(config.parameters.authentication).toBe('genericCredentialType');
      expect(config.parameters.genericAuthType).toBe('httpHeaderAuth');
    });

    it('should use environment variable for base URL', () => {
      const config = generateN8nHttpRequestConfig('/user/stats') as any;

      expect(config.parameters.url).toContain('$env.SOKUDO_API_BASE_URL');
    });

    it('should include Bearer token in headers', () => {
      const config = generateN8nHttpRequestConfig('/user/stats') as any;

      expect(config.parameters.sendHeaders).toBe(true);
      const authHeader = config.parameters.headerParameters.parameters.find(
        (h: any) => h.name === 'Authorization'
      );
      expect(authHeader).toBeDefined();
      expect(authHeader.value).toContain('Bearer');
    });
  });

  describe('n8nEventFilters', () => {
    it('should provide filters for all event types', () => {
      expect(n8nEventFilters.sessionCompleted).toBeDefined();
      expect(n8nEventFilters.achievementEarned).toBeDefined();
      expect(n8nEventFilters.userSignedUp).toBeDefined();
      expect(n8nEventFilters.subscriptionUpdated).toBeDefined();
      expect(n8nEventFilters.milestoneReached).toBeDefined();
    });

    it('should use n8n expression syntax', () => {
      Object.values(n8nEventFilters).forEach((filter) => {
        expect(filter).toMatch(/^=\{\{.*\}\}$/);
      });
    });

    it('should include WPM and accuracy filters', () => {
      expect(n8nEventFilters.highWpmSession).toContain('wpm > 100');
      expect(n8nEventFilters.lowAccuracy).toContain('accuracy < 80');
    });

    it('should include milestone-specific filters', () => {
      expect(n8nEventFilters.wpmMilestone).toContain('milestoneType');
      expect(n8nEventFilters.wpmOver100).toContain('milestoneValue >= 100');
    });
  });

  describe('n8nDataPaths', () => {
    it('should provide access paths for session data', () => {
      expect(n8nDataPaths.sessionWpm).toContain('$json.data.wpm');
      expect(n8nDataPaths.sessionAccuracy).toContain('$json.data.accuracy');
      expect(n8nDataPaths.sessionDuration).toContain('$json.data.durationMs');
    });

    it('should provide calculated duration in seconds', () => {
      expect(n8nDataPaths.sessionDurationSeconds).toContain('/ 1000');
    });

    it('should provide achievement data paths', () => {
      expect(n8nDataPaths.achievementName).toContain('$json.data.name');
      expect(n8nDataPaths.achievementIcon).toContain('$json.data.icon');
    });

    it('should provide user data paths', () => {
      expect(n8nDataPaths.userEmail).toContain('$json.data.email');
      expect(n8nDataPaths.userId).toContain('$json.data.userId');
    });

    it('should provide milestone data paths', () => {
      expect(n8nDataPaths.milestoneValue).toContain('$json.data.milestoneValue');
      expect(n8nDataPaths.currentWpm).toContain('$json.data.currentWpm');
    });

    it('should use n8n expression syntax', () => {
      Object.values(n8nDataPaths).forEach((path) => {
        expect(path).toMatch(/^\{\{.*\}\}$/);
      });
    });
  });

  describe('validateN8nWebhookPayload', () => {
    it('should validate correct payload structure', () => {
      const payload = {
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: { wpm: 85 },
      };

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing event field', () => {
      const payload = {
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "event" field');
    });

    it('should detect missing timestamp field', () => {
      const payload = {
        event: 'test',
        data: {},
      };

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "timestamp" field');
    });

    it('should detect missing data field', () => {
      const payload = {
        event: 'test',
        timestamp: '2024-02-05T10:30:00Z',
      };

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "data" field');
    });

    it('should reject invalid field types', () => {
      const payload = {
        event: 123, // Should be string
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it('should collect multiple errors', () => {
      const payload = {};

      const result = validateN8nWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('formatWebhookForN8n', () => {
    it('should format session completed event', () => {
      const payload = {
        event: 'session.completed',
        timestamp: '2024-02-05T10:30:00Z',
        data: { wpm: 85, accuracy: 95 },
      };

      const result = formatWebhookForN8n(payload);
      expect(result).toContain('85 WPM');
      expect(result).toContain('95% accuracy');
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

      const result = formatWebhookForN8n(payload);
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

      const result = formatWebhookForN8n(payload);
      expect(result).toContain('test@example.com');
      expect(result).toContain('signed up');
    });

    it('should format subscription updated event', () => {
      const payload = {
        event: 'user.subscription_updated',
        timestamp: '2024-02-05T10:30:00Z',
        data: { planName: 'Pro Plan', status: 'active' },
      };

      const result = formatWebhookForN8n(payload);
      expect(result).toContain('Pro Plan');
      expect(result).toContain('active');
    });

    it('should format milestone reached event', () => {
      const payload = {
        event: 'user.milestone_reached',
        timestamp: '2024-02-05T10:30:00Z',
        data: { milestoneValue: 100, milestoneType: 'wpm' },
      };

      const result = formatWebhookForN8n(payload);
      expect(result).toContain('100');
      expect(result).toContain('WPM');
    });

    it('should include timestamp in output', () => {
      const payload = {
        event: 'test',
        timestamp: '2024-02-05T10:30:00Z',
        data: {},
      };

      const result = formatWebhookForN8n(payload);
      expect(result).toMatch(/\[.*\]/); // Contains bracketed timestamp
    });

    it('should handle unknown event types gracefully', () => {
      const payload = {
        event: 'unknown.event',
        timestamp: '2024-02-05T10:30:00Z',
        data: { custom: 'data' },
      };

      const result = formatWebhookForN8n(payload);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateN8nCredentialSetup', () => {
    it('should generate webhook secret credential config', () => {
      const config = generateN8nCredentialSetup();

      expect(config.webhook_secret).toBeDefined();
      expect(config.webhook_secret.name).toBe('Sokudo Webhook Secret');
      expect(config.webhook_secret.data.webhook_secret).toContain('whsec_');
    });

    it('should generate API key credential config', () => {
      const config = generateN8nCredentialSetup();

      expect(config.api_key).toBeDefined();
      expect(config.api_key.name).toBe('Sokudo API Key');
      expect(config.api_key.type).toBe('httpHeaderAuth');
    });

    it('should include Authorization header in API key config', () => {
      const config = generateN8nCredentialSetup();

      expect(config.api_key.data.name).toBe('Authorization');
      expect(config.api_key.data.value).toContain('Bearer');
      expect(config.api_key.data.value).toContain('sk_');
    });

    it('should include helpful descriptions', () => {
      const config = generateN8nCredentialSetup();

      expect(config.webhook_secret.description).toContain('Webhook secret');
      expect(config.webhook_secret.description).toContain('Sokudo Dashboard');
      expect(config.api_key.description).toContain('API key');
      expect(config.api_key.description).toContain('API Keys');
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

      // Verify using n8n utility
      const verified = verifyN8nWebhookSignature(
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

        const result = validateN8nWebhookPayload(payload);
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

      const result = verifyN8nWebhookSignature(signature, payload, secret);
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

      const result = verifyN8nWebhookSignature(signature, payload, secret);
      expect(result).toBe(true);
    });

    it('should handle null and undefined in validation', () => {
      const result1 = validateN8nWebhookPayload(null);
      expect(result1.valid).toBe(false);

      const result2 = validateN8nWebhookPayload(undefined);
      expect(result2.valid).toBe(false);
    });

    it('should handle malformed JSON in formatWebhookForN8n', () => {
      const malformedPayload = {
        event: 'test',
        timestamp: 'invalid-date',
        data: {},
      };

      // Should not throw, even with invalid timestamp
      expect(() => formatWebhookForN8n(malformedPayload)).not.toThrow();
    });
  });
});
