import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { userProfiles } from '@/lib/db/schema';
import { isValidTimezone, getTimezoneFromPreferences } from '@/lib/limits';
import { apiRateLimit } from '@/lib/rate-limit';

const timezoneSchema = z.object({
  timezone: z.string().refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone',
  }),
});

/**
 * GET /api/user/timezone
 * Get the user's current timezone preference
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:timezone' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const preferences = profile?.preferences as Record<string, unknown> | null;
    const timezone = getTimezoneFromPreferences(preferences);

    return NextResponse.json({
      timezone: timezone ?? 'UTC',
      isDefault: timezone === null,
    });
  } catch (error) {
    console.error('Error fetching user timezone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/timezone
 * Update the user's timezone preference
 *
 * Body: { timezone: string } - IANA timezone identifier (e.g., 'America/New_York')
 */
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:timezone', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = timezoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { timezone } = parsed.data;

    // Get existing profile
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    if (existingProfile) {
      // Update existing profile's preferences
      const currentPreferences =
        (existingProfile.preferences as Record<string, unknown>) || {};
      const updatedPreferences = {
        ...currentPreferences,
        timezone,
      };

      await db
        .update(userProfiles)
        .set({
          preferences: updatedPreferences,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id));
    } else {
      // Create new profile with timezone preference
      await db.insert(userProfiles).values({
        userId: user.id,
        preferences: { timezone },
      });
    }

    return NextResponse.json({ timezone, success: true });
  } catch (error) {
    console.error('Error updating user timezone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
