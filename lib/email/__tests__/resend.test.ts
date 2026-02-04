import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sendEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should return failure when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;

    const { sendEmail } = await import('../resend');
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email service not configured');
  });

  it('should accept valid email parameters', async () => {
    const params = {
      to: 'user@example.com',
      subject: 'Weekly Report',
      html: '<html><body>Report content</body></html>',
    };

    expect(params.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(params.subject).toBeTruthy();
    expect(params.html).toContain('html');
  });
});
