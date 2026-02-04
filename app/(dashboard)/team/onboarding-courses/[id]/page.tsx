import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import {
  getTeamOnboardingCourseById,
  getOnboardingCourseProgress,
  getTeamForUser,
  getUser,
} from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export default async function OnboardingCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = parseInt(id, 10);

  if (isNaN(courseId)) {
    notFound();
  }

  const [course, progress, team, currentUser] = await Promise.all([
    getTeamOnboardingCourseById(courseId),
    getOnboardingCourseProgress(courseId),
    getTeamForUser(),
    getUser(),
  ]);

  if (!course) {
    notFound();
  }

  // Build progress map: stepId -> array of users who completed it
  const progressByStep = new Map<number, typeof progress>();
  for (const p of progress) {
    const existing = progressByStep.get(p.stepId) ?? [];
    existing.push(p);
    progressByStep.set(p.stepId, existing);
  }

  // Check current user's progress
  const userCompletedSteps = new Set(
    progress
      .filter((p) => p.userId === currentUser?.id)
      .map((p) => p.stepId)
  );

  const totalSteps = course.steps.length;
  const completedSteps = userCompletedSteps.size;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <Link
        href="/team/onboarding-courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {course.name}
          </h1>
          {course.status === 'active' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Active
            </span>
          )}
          {course.status === 'archived' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Archived
            </span>
          )}
        </div>
        {course.description && (
          <p className="text-sm text-gray-600">{course.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Avatar className="size-5">
            <AvatarFallback className="text-[10px]">
              {getInitials(course.creatorName, course.creatorEmail)}
            </AvatarFallback>
          </Avatar>
          <span>Created by {course.creatorName || course.creatorEmail}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Your Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{totalSteps} steps
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            Course Steps ({totalSteps})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {course.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No steps have been added to this course yet.
            </p>
          ) : (
            <div className="space-y-3">
              {course.steps.map((step, index) => {
                const isCompleted = userCompletedSteps.has(step.id);
                const stepProgress = progressByStep.get(step.id) ?? [];

                return (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 ${
                      isCompleted ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            {step.categoryName}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {step.challengeDifficulty}
                          </span>
                        </div>
                        <p className="font-mono text-sm text-gray-700 truncate">
                          {step.challengeContent.slice(0, 100)}
                          {step.challengeContent.length > 100 ? '...' : ''}
                        </p>
                        {step.challengeHint && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Hint: {step.challengeHint}
                          </p>
                        )}

                        {stepProgress.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Completed by:</span>
                            <div className="flex -space-x-1">
                              {stepProgress.slice(0, 5).map((p) => (
                                <Avatar key={p.userId} className="size-5 border-2 border-white">
                                  <AvatarFallback className="text-[8px]">
                                    {getInitials(p.userName, p.userEmail)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {stepProgress.length > 5 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  +{stepProgress.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
