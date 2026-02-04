import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GitHub OAuth callback route', () => {
  it('should redirect to NextAuth callback with code and state', async () => {
    const url = 'http://localhost:3000/api/auth/github/callback?code=github-code&state=github-state';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/github?code=github-code&state=github-state'
    );
  });

  it('should redirect to NextAuth callback with error parameter', async () => {
    const url = 'http://localhost:3000/api/auth/github/callback?error=access_denied';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/github?error=access_denied'
    );
  });

  it('should handle callback with all parameters', async () => {
    const url = 'http://localhost:3000/api/auth/github/callback?code=def456&state=uvw012&scope=read:user';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('/api/auth/callback/github');
    expect(location).toContain('code=def456');
    expect(location).toContain('state=uvw012');
  });

  it('should handle callback with no parameters', async () => {
    const url = 'http://localhost:3000/api/auth/github/callback';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/api/auth/callback/github?'
    );
  });

  it('should preserve special characters in parameters', async () => {
    const code = 'github-code-with-special-chars-789';
    const state = 'state-with-mixed_chars_012';
    const url = `http://localhost:3000/api/auth/github/callback?code=${code}&state=${state}`;
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain(`code=${code}`);
    expect(location).toContain(`state=${state}`);
  });

  it('should handle GitHub error_description parameter', async () => {
    const url = 'http://localhost:3000/api/auth/github/callback?error=access_denied&error_description=User%20cancelled';
    const request = new NextRequest(url);

    const response = await GET(request);

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('error=access_denied');
  });
});
