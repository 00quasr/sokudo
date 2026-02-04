import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { samlConfigurations, teamMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  generateAuthnRequest,
  findTeamByEmailDomain,
  SamlError,
} from '@/lib/auth/saml';

const loginSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const teamMatch = await findTeamByEmailDomain(email);

    if (!teamMatch) {
      return NextResponse.json(
        { error: 'SSO is not configured for this email domain' },
        { status: 404 }
      );
    }

    const { config } = teamMatch;

    if (!config.enabled) {
      return NextResponse.json(
        { error: 'SSO is not enabled for this team' },
        { status: 403 }
      );
    }

    const { url, relayState } = generateAuthnRequest(config);

    return NextResponse.json({
      redirectUrl: url,
      relayState,
    });
  } catch (err) {
    if (err instanceof SamlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('SAML login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
