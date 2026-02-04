import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSamlMetadata,
  generateAuthnRequest,
  parseSamlResponse,
  SamlError,
  getSpEntityId,
  getAcsUrl,
} from '../saml';
import type { SamlConfiguration } from '@/lib/db/schema';

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
  },
}));

// Mock session
vi.mock('../session', () => ({
  setSession: vi.fn().mockResolvedValue(undefined),
}));

const TEST_BASE_URL = 'http://localhost:3000';

function createMockConfig(overrides?: Partial<SamlConfiguration>): SamlConfiguration {
  return {
    id: 1,
    teamId: 1,
    entityId: 'https://idp.example.com/metadata',
    ssoUrl: 'https://idp.example.com/saml/sso',
    certificate: 'MIIDpDCCAoygAwIBAgIGAX...',
    sloUrl: null,
    nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    signRequests: false,
    enabled: true,
    allowIdpInitiated: false,
    defaultRole: 'member',
    autoProvision: true,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createSamlResponseXml(options: {
  statusCode?: string;
  issuer?: string;
  nameId?: string;
  audience?: string;
  notOnOrAfter?: string;
  notBefore?: string;
  sessionIndex?: string;
  attributes?: Record<string, string>;
} = {}): string {
  const {
    statusCode = 'urn:oasis:names:tc:SAML:2.0:status:Success',
    issuer = 'https://idp.example.com/metadata',
    nameId = 'user@example.com',
    audience = `${TEST_BASE_URL}/api/auth/saml/metadata`,
    notOnOrAfter = new Date(Date.now() + 3600000).toISOString(),
    notBefore = new Date(Date.now() - 60000).toISOString(),
    sessionIndex = '_session123',
    attributes = {},
  } = options;

  let attributeStatements = '';
  for (const [name, value] of Object.entries(attributes)) {
    attributeStatements += `
      <saml:Attribute Name="${name}">
        <saml:AttributeValue>${value}</saml:AttributeValue>
      </saml:Attribute>`;
  }

  return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_response123" Version="2.0">
    <saml:Issuer>${issuer}</saml:Issuer>
    <samlp:Status>
      <samlp:StatusCode Value="${statusCode}" />
    </samlp:Status>
    <saml:Assertion>
      <saml:Issuer>${issuer}</saml:Issuer>
      <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}">
        <saml:AudienceRestriction>
          <saml:Audience>${audience}</saml:Audience>
        </saml:AudienceRestriction>
      </saml:Conditions>
      <saml:AuthnStatement SessionIndex="${sessionIndex}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
      <saml:Subject>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${nameId}</saml:NameID>
      </saml:Subject>
      <saml:AttributeStatement>${attributeStatements}
      </saml:AttributeStatement>
    </saml:Assertion>
  </samlp:Response>`;
}

function encodeResponse(xml: string): string {
  return Buffer.from(xml, 'utf-8').toString('base64');
}

describe('SAML Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = TEST_BASE_URL;
  });

  describe('getSpEntityId', () => {
    it('should return entity ID based on BASE_URL', () => {
      const entityId = getSpEntityId();
      expect(entityId).toBe(`${TEST_BASE_URL}/api/auth/saml/metadata`);
    });

    it('should fall back to localhost when BASE_URL not set', () => {
      delete process.env.BASE_URL;
      const entityId = getSpEntityId();
      expect(entityId).toBe('http://localhost:3000/api/auth/saml/metadata');
    });
  });

  describe('getAcsUrl', () => {
    it('should return ACS URL based on BASE_URL', () => {
      const acsUrl = getAcsUrl();
      expect(acsUrl).toBe(`${TEST_BASE_URL}/api/auth/saml/callback`);
    });
  });

  describe('generateSamlMetadata', () => {
    it('should generate valid SP metadata XML', () => {
      const metadata = generateSamlMetadata(1);

      expect(metadata).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(metadata).toContain('md:EntityDescriptor');
      expect(metadata).toContain('md:SPSSODescriptor');
      expect(metadata).toContain(`entityID="${TEST_BASE_URL}/api/auth/saml/metadata"`);
      expect(metadata).toContain(`Location="${TEST_BASE_URL}/api/auth/saml/callback"`);
      expect(metadata).toContain('WantAssertionsSigned="true"');
      expect(metadata).toContain('urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST');
      expect(metadata).toContain('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
    });

    it('should include Assertion Consumer Service binding', () => {
      const metadata = generateSamlMetadata(1);
      expect(metadata).toContain('md:AssertionConsumerService');
      expect(metadata).toContain('isDefault="true"');
    });
  });

  describe('generateAuthnRequest', () => {
    it('should generate AuthnRequest and return redirect URL', () => {
      const config = createMockConfig();
      const result = generateAuthnRequest(config);

      expect(result.url).toContain(config.ssoUrl);
      expect(result.url).toContain('SAMLRequest=');
      expect(result.url).toContain('RelayState=');
      expect(result.relayState).toBeTruthy();
      expect(result.relayState.length).toBe(32); // 16 bytes hex
    });

    it('should include correct destination in AuthnRequest', () => {
      const config = createMockConfig({
        ssoUrl: 'https://custom-idp.example.com/sso',
      });
      const result = generateAuthnRequest(config);
      expect(result.url).toContain('https://custom-idp.example.com/sso');
    });

    it('should generate unique relay state for each request', () => {
      const config = createMockConfig();
      const result1 = generateAuthnRequest(config);
      const result2 = generateAuthnRequest(config);
      expect(result1.relayState).not.toBe(result2.relayState);
    });
  });

  describe('parseSamlResponse', () => {
    it('should parse a valid SAML response', () => {
      const xml = createSamlResponseXml();
      const config = createMockConfig();
      const result = parseSamlResponse(encodeResponse(xml), config);

      expect(result.nameId).toBe('user@example.com');
      expect(result.sessionIndex).toBe('_session123');
    });

    it('should extract attributes from SAML response', () => {
      const xml = createSamlResponseXml({
        attributes: {
          displayName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
        },
      });
      const config = createMockConfig();
      const result = parseSamlResponse(encodeResponse(xml), config);

      expect(result.attributes['displayName']).toBe('Test User');
      expect(result.attributes['firstName']).toBe('Test');
      expect(result.attributes['lastName']).toBe('User');
    });

    it('should throw SamlError for missing StatusCode', () => {
      const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">issuer</saml:Issuer>
      </samlp:Response>`;
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'Missing StatusCode in SAML response'
      );
    });

    it('should throw SamlError for failed status', () => {
      const xml = createSamlResponseXml({
        statusCode: 'urn:oasis:names:tc:SAML:2.0:status:Requester',
      });
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'SAML authentication failed with status'
      );
    });

    it('should throw SamlError for issuer mismatch', () => {
      const xml = createSamlResponseXml({
        issuer: 'https://wrong-idp.example.com/metadata',
      });
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'Issuer mismatch'
      );
    });

    it('should throw SamlError for expired assertion', () => {
      const xml = createSamlResponseXml({
        notOnOrAfter: new Date(Date.now() - 60000).toISOString(),
      });
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'SAML assertion has expired'
      );
    });

    it('should throw SamlError for assertion not yet valid', () => {
      const xml = createSamlResponseXml({
        notBefore: new Date(Date.now() + 120000).toISOString(), // 2 minutes in future (> 60s skew)
      });
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'SAML assertion is not yet valid'
      );
    });

    it('should allow clock skew of 60 seconds for NotBefore', () => {
      const xml = createSamlResponseXml({
        notBefore: new Date(Date.now() + 30000).toISOString(), // 30s in future (within 60s skew)
      });
      const config = createMockConfig();

      const result = parseSamlResponse(encodeResponse(xml), config);
      expect(result.nameId).toBe('user@example.com');
    });

    it('should throw SamlError for audience mismatch', () => {
      const xml = createSamlResponseXml({
        audience: 'https://wrong-audience.example.com',
      });
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'Audience mismatch'
      );
    });

    it('should throw SamlError for missing NameID', () => {
      const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
        <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
        </samlp:Status>
        <saml:Assertion>
          <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
        </saml:Assertion>
      </samlp:Response>`;
      const config = createMockConfig();

      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        SamlError
      );
      expect(() => parseSamlResponse(encodeResponse(xml), config)).toThrow(
        'Missing NameID'
      );
    });

    it('should handle response without session index', () => {
      const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
        <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
        <samlp:Status>
          <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success" />
        </samlp:Status>
        <saml:Assertion>
          <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
          <saml:Subject>
            <saml:NameID>user@example.com</saml:NameID>
          </saml:Subject>
        </saml:Assertion>
      </samlp:Response>`;
      const config = createMockConfig();

      const result = parseSamlResponse(encodeResponse(xml), config);
      expect(result.nameId).toBe('user@example.com');
      expect(result.sessionIndex).toBeUndefined();
    });

    it('should parse response without certificate verification when certificate is empty', () => {
      const xml = createSamlResponseXml();
      const config = createMockConfig({ certificate: '' });
      const result = parseSamlResponse(encodeResponse(xml), config);
      expect(result.nameId).toBe('user@example.com');
    });
  });

  describe('SamlError', () => {
    it('should be an instance of Error', () => {
      const error = new SamlError('test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SamlError);
      expect(error.name).toBe('SamlError');
      expect(error.message).toBe('test error');
    });
  });
});
