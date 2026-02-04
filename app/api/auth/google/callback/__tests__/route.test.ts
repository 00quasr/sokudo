import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Google OAuth callback route', () => {
  it('should redirect to NextAuth callback with code and state', async () => {
    const url = 'http://localhost:3000/api/auth/google/callback?code=test-code&state=test-state';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/google?code=test-code&state=test-state'
    );
  });

  it('should redirect to NextAuth callback with error parameter', async () => {
    const url = 'http://localhost:3000/api/auth/google/callback?error=access_denied';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/google?error=access_denied'
    );
  });

  it('should handle callback with all parameters', async () => {
    const url = 'http://localhost:3000/api/auth/google/callback?code=abc123&state=xyz789&scope=email%20profile';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('/api/auth/callback/google');
    expect(location).toContain('code=abc123');
    expect(location).toContain('state=xyz789');
  });

  it('should handle callback with no parameters', async () => {
    const url = 'http://localhost:3000/api/auth/google/callback';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/google?'
    );
  });

  it('should preserve special characters in parameters', async () => {
    const code = 'test-code-with-special-chars-123';
    const state = 'state-with-dashes-and-underscores_456';
    const url = `http://localhost:3000/api/auth/google/callback?code=${code}&state=${state}`;
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain(`code=${code}`);
    expect(location).toContain(`state=${state}`);
  });
});
