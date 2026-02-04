import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { samlConfigurations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  parseSamlResponse,
  handleSamlLogin,
  findTeamByEmailDomain,
  SamlError,
  getSpEntityId,
} from '@/lib/auth/saml';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse') as string | null;
    const relayState = formData.get('RelayState') as string | null;

    if (!samlResponse) {
      return redirectWithError('Missing SAMLResponse');
    }

    // Decode and parse SAML response to get the issuer/email to find the config
    const xml = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // Extract issuer from the response to find the matching SAML config
    const issuerMatch = xml.match(
      /<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/
    );

    let config = null;

    if (issuerMatch) {
      const issuer = issuerMatch[1].trim();
      // Find config by matching entity ID
      const [foundConfig] = await db
        .select()
        .from(samlConfigurations)
        .where(eq(samlConfigurations.entityId, issuer))
        .limit(1);
      config = foundConfig;
    }

    if (!config) {
      return redirectWithError('No SSO configuration found for this identity provider');
    }

    if (!config.enabled) {
      return redirectWithError('SSO is not enabled for this team');
    }

    const parsed = parseSamlResponse(samlResponse, config);
    await handleSamlLogin(parsed, config);

    // Redirect to dashboard on success
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/dashboard`, { status: 302 });
  } catch (err) {
    if (err instanceof SamlError) {
      return redirectWithError(err.message);
    }
    console.error('SAML callback error:', err);
    return redirectWithError('Authentication failed');
  }
}

function redirectWithError(error: string): NextResponse {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const encodedError = encodeURIComponent(error);
  return NextResponse.redirect(
    `${baseUrl}/sign-in?error=${encodedError}`,
    { status: 302 }
  );
}
