import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { userProfiles } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { apiRateLimit } from '@/lib/rate-limit';

const preferencesSchema = z.object({
  weeklyReportEnabled: z.boolean().optional(),
  streakReminderEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:preferences' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const preferences = (profile?.preferences as Record<string, unknown>) || {};

    return NextResponse.json({
      weeklyReportEnabled: preferences.weeklyReportEnabled !== false,
      streakReminderEnabled: preferences.streakReminderEnabled !== false,
      pushNotificationsEnabled: preferences.pushNotificationsEnabled === true,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'user:preferences', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    });

    const currentPreferences = (profile?.preferences as Record<string, unknown>) || {};
    const newPreferences = { ...currentPreferences, ...parsed.data };

    if (profile) {
      await db
        .update(userProfiles)
        .set({
          preferences: newPreferences,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id));
    } else {
      await db.insert(userProfiles).values({
        userId: user.id,
        preferences: newPreferences,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: newPreferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
