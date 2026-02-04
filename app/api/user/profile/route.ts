import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { userProfiles } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { apiRateLimit } from '@/lib/rate-limit';

const updateProfileSchema = z.object({
  avatarUrl: z
    .string()
    .url('Must be a valid URL')
    .max(500)
    .nullable()
    .optional(),
  bio: z.string().max(500).nullable().optional(),
  preferredCategoryIds: z.array(z.number().int().positive()).max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:profile' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    return NextResponse.json({
      avatarUrl: profile?.avatarUrl ?? null,
      bio: profile?.bio ?? null,
      preferredCategoryIds:
        (profile?.preferredCategoryIds as number[]) ?? [],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:profile', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.avatarUrl !== undefined) {
      updates.avatarUrl = parsed.data.avatarUrl;
    }
    if (parsed.data.bio !== undefined) {
      updates.bio = parsed.data.bio;
    }
    if (parsed.data.preferredCategoryIds !== undefined) {
      updates.preferredCategoryIds = parsed.data.preferredCategoryIds;
    }

    if (profile) {
      await db
        .update(userProfiles)
        .set(updates)
        .where(eq(userProfiles.userId, user.id));
    } else {
      await db.insert(userProfiles).values({
        userId: user.id,
        avatarUrl: parsed.data.avatarUrl ?? null,
        bio: parsed.data.bio ?? null,
        preferredCategoryIds: parsed.data.preferredCategoryIds ?? [],
      });
    }

    const updated = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updated?.avatarUrl ?? null,
      bio: updated?.bio ?? null,
      preferredCategoryIds:
        (updated?.preferredCategoryIds as number[]) ?? [],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
