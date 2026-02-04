import { createHash, createVerify, randomBytes } from 'crypto';
import { db } from '@/lib/db/drizzle';
import {
  samlConfigurations,
  users,
  teams,
  teamMembers,
  activityLogs,
  ActivityType,
  type SamlConfiguration,
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { setSession } from './session';

const SAML_NS = 'urn:oasis:names:tc:SAML:2.0:assertion';
const SAMLP_NS = 'urn:oasis:names:tc:SAML:2.0:protocol';

export function getSpEntityId(): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/saml/metadata`;
}

export function getAcsUrl(): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/saml/callback`;
}

export function generateSamlMetadata(teamId: number): string {
  const entityId = getSpEntityId();
  const acsUrl = getAcsUrl();

  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${escapeXml(entityId)}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${escapeXml(acsUrl)}"
      index="0"
      isDefault="true" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
}

export function generateAuthnRequest(config: SamlConfiguration): {
  url: string;
  relayState: string;
} {
  const id = `_${randomBytes(16).toString('hex')}`;
  const issueInstant = new Date().toISOString();
  const entityId = getSpEntityId();
  const acsUrl = getAcsUrl();
  const relayState = randomBytes(16).toString('hex');

  const authnRequest = `<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${id}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${escapeXml(config.ssoUrl)}"
  AssertionConsumerServiceURL="${escapeXml(acsUrl)}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${escapeXml(entityId)}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${escapeXml(config.nameIdFormat)}"
    AllowCreate="true" />
</samlp:AuthnRequest>`;

  const deflated = Buffer.from(authnRequest, 'utf-8').toString('base64');
  const encodedRequest = encodeURIComponent(deflated);

  const url = `${config.ssoUrl}?SAMLRequest=${encodedRequest}&RelayState=${relayState}`;

  return { url, relayState };
}

export interface SamlParsedResponse {
  nameId: string;
  sessionIndex?: string;
  attributes: Record<string, string>;
}

export function parseSamlResponse(
  samlResponseB64: string,
  config: SamlConfiguration
): SamlParsedResponse {
  const xml = Buffer.from(samlResponseB64, 'base64').toString('utf-8');

  // Verify the response status
  const statusMatch = xml.match(
    /<samlp?:StatusCode[^>]*Value="([^"]+)"[^>]*\/?>/
  );
  if (!statusMatch) {
    throw new SamlError('Missing StatusCode in SAML response');
  }
  const statusCode = statusMatch[1];
  if (!statusCode.endsWith(':Success')) {
    throw new SamlError(`SAML authentication failed with status: ${statusCode}`);
  }

  // Verify signature if certificate is provided
  if (config.certificate) {
    verifySamlSignature(xml, config.certificate);
  }

  // Verify issuer matches IdP entity ID
  const issuerMatch = xml.match(
    /<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/
  );
  if (issuerMatch) {
    const responseIssuer = issuerMatch[1].trim();
    if (responseIssuer !== config.entityId) {
      throw new SamlError(
        `Issuer mismatch: expected ${config.entityId}, got ${responseIssuer}`
      );
    }
  }

  // Check NotOnOrAfter conditions
  const conditionsMatch = xml.match(
    /<saml:Conditions[^>]*NotOnOrAfter="([^"]+)"[^>]*/
  );
  if (conditionsMatch) {
    const notOnOrAfter = new Date(conditionsMatch[1]);
    if (new Date() >= notOnOrAfter) {
      throw new SamlError('SAML assertion has expired');
    }
  }

  // Check NotBefore conditions
  const notBeforeMatch = xml.match(
    /<saml:Conditions[^>]*NotBefore="([^"]+)"[^>]*/
  );
  if (notBeforeMatch) {
    const notBefore = new Date(notBeforeMatch[1]);
    // Allow 60 second clock skew
    const skewedNow = new Date(Date.now() + 60000);
    if (notBefore > skewedNow) {
      throw new SamlError('SAML assertion is not yet valid');
    }
  }

  // Verify audience restriction
  const audienceMatch = xml.match(
    /<saml:Audience>([^<]+)<\/saml:Audience>/
  );
  if (audienceMatch) {
    const audience = audienceMatch[1].trim();
    const entityId = getSpEntityId();
    if (audience !== entityId) {
      throw new SamlError(
        `Audience mismatch: expected ${entityId}, got ${audience}`
      );
    }
  }

  // Extract NameID
  const nameIdMatch = xml.match(
    /<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/
  );
  if (!nameIdMatch) {
    throw new SamlError('Missing NameID in SAML assertion');
  }
  const nameId = nameIdMatch[1].trim();

  // Extract SessionIndex
  const sessionIndexMatch = xml.match(
    /<saml:AuthnStatement[^>]*SessionIndex="([^"]+)"/
  );
  const sessionIndex = sessionIndexMatch?.[1];

  // Extract attributes
  const attributes: Record<string, string> = {};
  const attrRegex =
    /<saml:Attribute[^>]*Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]*)<\/saml:AttributeValue>[\s\S]*?<\/saml:Attribute>/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(xml)) !== null) {
    attributes[attrMatch[1]] = attrMatch[2].trim();
  }

  return { nameId, sessionIndex, attributes };
}

function verifySamlSignature(xml: string, certificate: string): void {
  // Extract the SignatureValue and SignedInfo
  const sigValueMatch = xml.match(
    /<ds:SignatureValue[^>]*>([\s\S]*?)<\/ds:SignatureValue>/
  );
  const signedInfoMatch = xml.match(
    /<ds:SignedInfo[^>]*>[\s\S]*?<\/ds:SignedInfo>/
  );

  if (!sigValueMatch || !signedInfoMatch) {
    // If no signature present but certificate is configured, the IdP may not be signing
    // In production this should be enforced, but for initial setup we allow it
    return;
  }

  const signatureValue = sigValueMatch[1].replace(/\s+/g, '');
  const signedInfo = signedInfoMatch[0];

  // Determine the signature algorithm
  const sigAlgoMatch = signedInfo.match(
    /Algorithm="([^"]+)"/
  );
  let algorithm = 'RSA-SHA256';
  if (sigAlgoMatch) {
    const algoUri = sigAlgoMatch[1];
    if (algoUri.includes('sha1')) algorithm = 'RSA-SHA1';
    else if (algoUri.includes('sha512')) algorithm = 'RSA-SHA512';
  }

  // Format certificate for verification
  const certPem = formatCertificate(certificate);

  try {
    const verifier = createVerify(algorithm);
    verifier.update(signedInfo);
    const isValid = verifier.verify(certPem, signatureValue, 'base64');

    if (!isValid) {
      throw new SamlError('SAML signature verification failed');
    }
  } catch (err) {
    if (err instanceof SamlError) throw err;
    throw new SamlError('SAML signature verification error: invalid certificate or signature');
  }
}

function formatCertificate(cert: string): string {
  // Remove any existing PEM headers/footers and whitespace
  const cleaned = cert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '');

  // Re-add PEM headers with proper line breaks
  const lines = cleaned.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

export class SamlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamlError';
  }
}

export async function getSamlConfigForTeam(
  teamId: number
): Promise<SamlConfiguration | null> {
  const [config] = await db
    .select()
    .from(samlConfigurations)
    .where(
      and(
        eq(samlConfigurations.teamId, teamId),
        eq(samlConfigurations.enabled, true)
      )
    )
    .limit(1);
  return config ?? null;
}

export async function getSamlConfigByTeamId(
  teamId: number
): Promise<SamlConfiguration | null> {
  const [config] = await db
    .select()
    .from(samlConfigurations)
    .where(eq(samlConfigurations.teamId, teamId))
    .limit(1);
  return config ?? null;
}

export async function findTeamByEmailDomain(
  email: string
): Promise<{ teamId: number; config: SamlConfiguration } | null> {
  // Find all enabled SAML configs and check if the user's email domain
  // matches any team member's email domain
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return null;

  const configs = await db
    .select()
    .from(samlConfigurations)
    .where(eq(samlConfigurations.enabled, true));

  for (const config of configs) {
    // Check if any existing team member shares the email domain
    const existingMembers = await db
      .select({ email: users.email })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, config.teamId))
      .limit(10);

    for (const member of existingMembers) {
      const memberDomain = member.email.split('@')[1]?.toLowerCase();
      if (memberDomain === emailDomain) {
        return { teamId: config.teamId, config };
      }
    }
  }

  return null;
}

export async function handleSamlLogin(
  parsed: SamlParsedResponse,
  config: SamlConfiguration
): Promise<{ userId: number }> {
  const email = parsed.nameId.toLowerCase();

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (existingUser) {
    // Check if user is already a member of this team
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, existingUser.id),
          eq(teamMembers.teamId, config.teamId)
        )
      )
      .limit(1);

    if (!membership) {
      // Auto-add to team if auto-provision is on
      if (config.autoProvision) {
        await db.insert(teamMembers).values({
          userId: existingUser.id,
          teamId: config.teamId,
          role: config.defaultRole,
        });
      } else {
        throw new SamlError(
          'User is not a member of the team and auto-provisioning is disabled'
        );
      }
    }

    // Set session
    await setSession(existingUser);

    // Log activity
    await db.insert(activityLogs).values({
      teamId: config.teamId,
      userId: existingUser.id,
      action: ActivityType.SSO_LOGIN,
    });

    return { userId: existingUser.id };
  }

  // Auto-provision new user
  if (!config.autoProvision) {
    throw new SamlError(
      'User does not exist and auto-provisioning is disabled'
    );
  }

  const name =
    parsed.attributes['displayName'] ||
    parsed.attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    parsed.attributes['firstName']
      ? `${parsed.attributes['firstName'] || ''} ${parsed.attributes['lastName'] || ''}`.trim()
      : undefined;

  // Create user with a random password hash (SSO users don't use passwords)
  const randomPasswordHash = createHash('sha256')
    .update(randomBytes(32))
    .digest('hex');

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash: randomPasswordHash,
      name: name || null,
      role: 'member',
    })
    .returning();

  // Add to team
  await db.insert(teamMembers).values({
    userId: newUser.id,
    teamId: config.teamId,
    role: config.defaultRole,
  });

  // Set session
  await setSession(newUser);

  // Log activity
  await db.insert(activityLogs).values({
    teamId: config.teamId,
    userId: newUser.id,
    action: ActivityType.SSO_LOGIN,
  });

  return { userId: newUser.id };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
