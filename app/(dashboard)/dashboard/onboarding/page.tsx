import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { developerOnboardingSteps, userOnboardingProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingContent } from './onboarding-content';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Developer Onboarding Guide',
  description: 'Learn how to use Sokudo to improve your typing speed for developer workflows',
};

async function getOnboardingData(userId: number) {
  const steps = await db
    .select()
    .from(developerOnboardingSteps)
    .orderBy(developerOnboardingSteps.stepOrder);

  const progress = await db
    .select()
    .from(userOnboardingProgress)
    .where(eq(userOnboardingProgress.userId, userId));

  return { steps, progress };
}

async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const { steps, progress } = await getOnboardingData(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer Onboarding Guide</h1>
          <p className="text-muted-foreground">
            Learn how to make the most of Sokudo and build your typing speed for developer
            workflows
          </p>
        </div>

        <OnboardingContent steps={steps} initialProgress={progress} />
      </div>
    </div>
  );
}

function OnboardingPageLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<OnboardingPageLoading />}>
      <OnboardingPage />
    </Suspense>
  );
}
