import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type { TeamRole } from '@/lib/auth/permissions';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:members:update', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memberId } = await params;
    const targetUserId = parseInt(memberId, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateTeamMemberRole(
      targetUserId,
      parsed.data.role as TeamRole
    );

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('owner role required')) {
        return NextResponse.json(
          { error: 'Forbidden: only the team owner can change roles' },
          { status: 403 }
        );
      }
      if (error.message.includes('Not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }
    console.error('Error updating team member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:members:delete', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { memberId } = await params;
    const targetUserId = parseInt(memberId, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    await removeTeamMember(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('admin role required')) {
        return NextResponse.json(
          { error: 'Forbidden: admin role required' },
          { status: 403 }
        );
      }
      if (error.message.includes('Not authorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
