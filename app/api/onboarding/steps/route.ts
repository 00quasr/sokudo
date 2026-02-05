import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { developerOnboardingSteps, userOnboardingProgress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all onboarding steps
    const steps = await db
      .select()
      .from(developerOnboardingSteps)
      .orderBy(developerOnboardingSteps.stepOrder);

    // Fetch user's progress
    const progress = await db
      .select()
      .from(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, session.user.id));

    return NextResponse.json({
      steps,
      progress,
    });
  } catch (error) {
    console.error('Error fetching onboarding steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding steps' },
      { status: 500 }
    );
  }
}
