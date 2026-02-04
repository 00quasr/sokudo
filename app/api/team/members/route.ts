import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamMembersWithStats,
  createTeamInvitation,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamRole } from '@/lib/auth/permissions';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:members' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const members = await getTeamMembersWithStats();
    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Error && error.message.includes('admin role required')) {
      return NextResponse.json(
        { error: 'Forbidden: admin role required' },
        { status: 403 }
      );
    }
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:members', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const invitation = await createTeamInvitation({
      email: parsed.data.email,
      role: parsed.data.role as TeamRole,
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('admin role required')) {
        return NextResponse.json(
          { error: 'Forbidden: admin role required' },
          { status: 403 }
        );
      }
      if (error.message.includes('already exists') || error.message.includes('already a member')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
