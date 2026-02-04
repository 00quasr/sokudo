import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: {
      teamMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock schema
vi.mock('@/lib/db/schema', () => ({
  samlConfigurations: {},
  users: {},
  teams: {},
  teamMembers: {},
  activityLogs: {},
  ActivityType: {
    SSO_LOGIN: 'SSO_LOGIN',
    SSO_CONFIG_UPDATED: 'SSO_CONFIG_UPDATED',
  },
}));

// Mock SAML functions
vi.mock('@/lib/auth/saml', () => ({
  generateSamlMetadata: vi.fn().mockReturnValue('<xml>mock metadata</xml>'),
  generateAuthnRequest: vi.fn().mockReturnValue({
    url: 'https://idp.example.com/saml/sso?SAMLRequest=encoded',
    relayState: 'abc123',
  }),
  parseSamlResponse: vi.fn().mockReturnValue({
    nameId: 'user@example.com',
    sessionIndex: '_session123',
    attributes: { displayName: 'Test User' },
  }),
  handleSamlLogin: vi.fn().mockResolvedValue({ userId: 1 }),
  findTeamByEmailDomain: vi.fn(),
  getSamlConfigByTeamId: vi.fn(),
  getSamlConfigForTeam: vi.fn(),
  getSpEntityId: vi.fn().mockReturnValue('http://localhost:3000/api/auth/saml/metadata'),
  SamlError: class SamlError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SamlError';
    }
  },
}));

// Mock queries
vi.mock('@/lib/db/queries', () => ({
  getUser: vi.fn(),
}));

// Mock permissions
vi.mock('@/lib/auth/permissions', () => ({
  requireTeamOwner: vi.fn(),
}));

// Mock session
vi.mock('@/lib/auth/session', () => ({
  setSession: vi.fn().mockResolvedValue(undefined),
}));

import { findTeamByEmailDomain, getSamlConfigByTeamId } from '@/lib/auth/saml';
import { getUser } from '@/lib/db/queries';
import { requireTeamOwner } from '@/lib/auth/permissions';

const mockFindTeamByEmailDomain = findTeamByEmailDomain as ReturnType<typeof vi.fn>;
const mockGetSamlConfigByTeamId = getSamlConfigByTeamId as ReturnType<typeof vi.fn>;
const mockGetUser = getUser as ReturnType<typeof vi.fn>;
const mockRequireTeamOwner = requireTeamOwner as ReturnType<typeof vi.fn>;

describe('SAML API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3000';
  });

  describe('GET /api/auth/saml/metadata', () => {
    it('should return XML metadata', async () => {
      const { GET } = await import('../metadata/route');
      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/xml');
      const text = await response.text();
      expect(text).toBe('<xml>mock metadata</xml>');
    });
  });

  describe('POST /api/auth/saml/login', () => {
    it('should return redirect URL when SSO is configured', async () => {
      mockFindTeamByEmailDomain.mockResolvedValue({
        teamId: 1,
        config: {
          id: 1,
          teamId: 1,
          entityId: 'https://idp.example.com/metadata',
          ssoUrl: 'https://idp.example.com/saml/sso',
          enabled: true,
        },
      });

      const { POST } = await import('../login/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.redirectUrl).toContain('https://idp.example.com/saml/sso');
      expect(data.relayState).toBe('abc123');
    });

    it('should return 400 for invalid email', async () => {
      const { POST } = await import('../login/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'not-an-email' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 when no SSO config found for domain', async () => {
      mockFindTeamByEmailDomain.mockResolvedValue(null);

      const { POST } = await import('../login/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@noconfigured.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not configured');
    });

    it('should return 403 when SSO is disabled', async () => {
      mockFindTeamByEmailDomain.mockResolvedValue({
        teamId: 1,
        config: {
          id: 1,
          teamId: 1,
          enabled: false,
        },
      });

      const { POST } = await import('../login/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('not enabled');
    });
  });

  describe('POST /api/auth/saml/callback', () => {
    it('should redirect to dashboard on successful SAML response', async () => {
      const { db } = await import('@/lib/db/drizzle');
      const mockDb = db as unknown as {
        select: ReturnType<typeof vi.fn>;
        from: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        limit: ReturnType<typeof vi.fn>;
      };
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([{
        id: 1,
        teamId: 1,
        entityId: 'https://idp.example.com/metadata',
        ssoUrl: 'https://idp.example.com/saml/sso',
        certificate: 'cert',
        enabled: true,
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        autoProvision: true,
        defaultRole: 'member',
      }]);

      const samlResponseB64 = Buffer.from(
        '<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://idp.example.com/metadata</saml:Issuer>'
      ).toString('base64');

      const formData = new FormData();
      formData.set('SAMLResponse', samlResponseB64);
      formData.set('RelayState', 'abc123');

      const { POST } = await import('../callback/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/callback', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/dashboard');
    });

    it('should redirect to sign-in with error when SAMLResponse is missing', async () => {
      const formData = new FormData();

      const { POST } = await import('../callback/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/callback', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/sign-in');
      expect(response.headers.get('Location')).toContain('error=');
    });

    it('should redirect to sign-in with error when no config found', async () => {
      const { db } = await import('@/lib/db/drizzle');
      const mockDb = db as unknown as {
        select: ReturnType<typeof vi.fn>;
        from: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        limit: ReturnType<typeof vi.fn>;
      };
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([]);

      const samlResponseB64 = Buffer.from(
        '<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">https://unknown-idp.example.com</saml:Issuer>'
      ).toString('base64');

      const formData = new FormData();
      formData.set('SAMLResponse', samlResponseB64);

      const { POST } = await import('../callback/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/callback', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/sign-in');
      expect(response.headers.get('Location')).toContain('error=');
    });
  });

  describe('GET /api/auth/saml/config', () => {
    it('should return config for authenticated team owner', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });
      mockGetSamlConfigByTeamId.mockResolvedValue({
        id: 1,
        teamId: 1,
        entityId: 'https://idp.example.com/metadata',
        ssoUrl: 'https://idp.example.com/saml/sso',
        certificate: 'MIIDpDCCA...',
        sloUrl: null,
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        signRequests: false,
        enabled: true,
        allowIdpInitiated: false,
        defaultRole: 'member',
        autoProvision: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { GET } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config).toBeDefined();
      expect(data.config.entityId).toBe('https://idp.example.com/metadata');
      expect(data.config.hasCertificate).toBe(true);
      // Should not expose the full certificate
      expect(data.config.certificate).toBeUndefined();
    });

    it('should return null config when none exists', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });
      mockGetSamlConfigByTeamId.mockResolvedValue(null);

      const { GET } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config).toBeNull();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null);

      const { GET } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-owner team members', async () => {
      mockGetUser.mockResolvedValue({ id: 2, email: 'member@example.com' });
      mockRequireTeamOwner.mockRejectedValue(new Error('Insufficient permissions: owner role required'));

      const { GET } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/auth/saml/config', () => {
    it('should create new config for team without existing SSO', async () => {
      const { db } = await import('@/lib/db/drizzle');
      const mockDb = db as unknown as {
        insert: ReturnType<typeof vi.fn>;
        values: ReturnType<typeof vi.fn>;
        returning: ReturnType<typeof vi.fn>;
      };

      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });
      mockGetSamlConfigByTeamId.mockResolvedValue(null);

      const newConfig = {
        id: 1,
        teamId: 1,
        entityId: 'https://idp.example.com/metadata',
        ssoUrl: 'https://idp.example.com/saml/sso',
        certificate: 'MIIDpDCCA...',
        enabled: false,
      };
      mockDb.insert.mockReturnThis();
      mockDb.values.mockReturnThis();
      mockDb.returning.mockResolvedValueOnce([newConfig]);

      const { PUT } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'PUT',
        body: JSON.stringify({
          entityId: 'https://idp.example.com/metadata',
          ssoUrl: 'https://idp.example.com/saml/sso',
          certificate: 'MIIDpDCCA...',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      expect(response.status).toBe(201);
    });

    it('should return 400 for invalid configuration', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });

      const { PUT } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'PUT',
        body: JSON.stringify({
          entityId: '', // invalid: empty
          ssoUrl: 'not-a-url', // invalid: not URL
          certificate: '', // invalid: empty
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null);

      const { PUT } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'PUT',
        body: JSON.stringify({
          entityId: 'test',
          ssoUrl: 'https://idp.example.com/sso',
          certificate: 'cert',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/auth/saml/config', () => {
    it('should delete existing config', async () => {
      const { db } = await import('@/lib/db/drizzle');
      const mockDb = db as unknown as {
        delete: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        insert: ReturnType<typeof vi.fn>;
        values: ReturnType<typeof vi.fn>;
      };

      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });
      mockGetSamlConfigByTeamId.mockResolvedValue({
        id: 1,
        teamId: 1,
        entityId: 'https://idp.example.com/metadata',
      });

      mockDb.delete.mockReturnThis();
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.insert.mockReturnThis();
      mockDb.values.mockResolvedValueOnce(undefined);

      const { DELETE } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 404 when no config exists', async () => {
      mockGetUser.mockResolvedValue({ id: 1, email: 'owner@example.com' });
      mockRequireTeamOwner.mockResolvedValue({ id: 1, userId: 1, teamId: 1, role: 'owner' });
      mockGetSamlConfigByTeamId.mockResolvedValue(null);

      const { DELETE } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null);

      const { DELETE } = await import('../config/route');
      const request = new NextRequest('http://localhost:3000/api/auth/saml/config', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      expect(response.status).toBe(401);
    });
  });
});
