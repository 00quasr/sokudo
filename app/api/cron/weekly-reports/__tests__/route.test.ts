import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/email/send-weekly-report', () => ({
  sendAllWeeklyReports: vi.fn(),
}));

describe('POST /api/cron/weekly-reports', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should return 401 when CRON_SECRET is set and auth header is missing', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 401 when auth header does not match CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should process request when auth header matches CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const { sendAllWeeklyReports } = await import('@/lib/email/send-weekly-report');
    vi.mocked(sendAllWeeklyReports).mockResolvedValue({
      sent: 5,
      failed: 0,
      errors: [],
    });

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.sent).toBe(5);
    expect(json.failed).toBe(0);
  });

  it('should allow request when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;

    const { sendAllWeeklyReports } = await import('@/lib/email/send-weekly-report');
    vi.mocked(sendAllWeeklyReports).mockResolvedValue({
      sent: 3,
      failed: 1,
      errors: [{ userId: 1, error: 'Email failed' }],
    });

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.sent).toBe(3);
    expect(json.failed).toBe(1);
    expect(json.errors).toHaveLength(1);
  });

  it('should return 500 when sendAllWeeklyReports throws', async () => {
    delete process.env.CRON_SECRET;

    const { sendAllWeeklyReports } = await import('@/lib/email/send-weekly-report');
    vi.mocked(sendAllWeeklyReports).mockRejectedValue(new Error('Database error'));

    const { POST } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('Failed to send weekly reports');
    expect(json.message).toBe('Database error');
  });
});

describe('GET /api/cron/weekly-reports', () => {
  it('should delegate to POST handler', async () => {
    delete process.env.CRON_SECRET;

    const { sendAllWeeklyReports } = await import('@/lib/email/send-weekly-report');
    vi.mocked(sendAllWeeklyReports).mockResolvedValue({
      sent: 2,
      failed: 0,
      errors: [],
    });

    const { GET } = await import('../route');
    const request = new NextRequest('http://localhost/api/cron/weekly-reports', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
