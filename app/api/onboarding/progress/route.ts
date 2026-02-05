import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { userOnboardingProgress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const progressSchema = z.object({
  stepId: z.number().int().positive(),
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { stepId, completed, skipped } = validation.data;

    // Check if progress record exists
    const existingProgress = await db
      .select()
      .from(userOnboardingProgress)
      .where(
        and(
          eq(userOnboardingProgress.userId, session.user.id),
          eq(userOnboardingProgress.stepId, stepId)
        )
      )
      .limit(1);

    if (existingProgress.length > 0) {
      // Update existing progress
      const [updated] = await db
        .update(userOnboardingProgress)
        .set({
          completed: completed ?? existingProgress[0].completed,
          skipped: skipped ?? existingProgress[0].skipped,
          completedAt:
            completed && !existingProgress[0].completed
              ? new Date()
              : existingProgress[0].completedAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userOnboardingProgress.userId, session.user.id),
            eq(userOnboardingProgress.stepId, stepId)
          )
        )
        .returning();

      return NextResponse.json({ progress: updated });
    } else {
      // Create new progress record
      const [created] = await db
        .insert(userOnboardingProgress)
        .values({
          userId: session.user.id,
          stepId,
          completed: completed ?? false,
          skipped: skipped ?? false,
          completedAt: completed ? new Date() : null,
        })
        .returning();

      return NextResponse.json({ progress: created });
    }
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding progress' },
      { status: 500 }
    );
  }
}
