import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  Users,
  AlertCircle,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { getTeamOnboardingCourses, getTeamForUser, getUser } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import type { OnboardingCourseWithDetails } from '@/lib/db/queries';

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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

function CourseCard({
  course,
}: {
  course: OnboardingCourseWithDetails;
}) {
  return (
    <Link href={`/team/onboarding-courses/${course.id}`}>
      <Card className="hover:border-orange-200 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {course.name}
                </h3>
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
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(course.creatorName, course.creatorEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{course.creatorName || course.creatorEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{course.stepCount} {course.stepCount === 1 ? 'step' : 'steps'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(course.createdAt)}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function TeamOnboardingCoursesPage() {
  const [courses, team, currentUser] = await Promise.all([
    getTeamOnboardingCourses(),
    getTeamForUser(),
    getUser(),
  ]);

  const hasTeam = team !== null;
  const isAdmin = team?.teamMembers?.some(
    (m) => m.user.id === currentUser?.id && (m.role === 'owner' || m.role === 'admin')
  );

  const activeCourses = courses.filter((c) => c.status === 'active');
  const archivedCourses = courses.filter((c) => c.status === 'archived');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Onboarding Courses
        </h1>
        {isAdmin && (
          <Link
            href="/team/onboarding-courses/create"
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        )}
      </div>

      {!hasTeam ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No team found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              You need to be part of a team to view onboarding courses.
              Ask your team owner for an invitation.
            </p>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No onboarding courses yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Onboarding courses are admin-defined challenge sequences to help new
              team members get up to speed. {isAdmin ? 'Create one to get started!' : 'Ask an admin to create one.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  Active Courses ({activeCourses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </CardContent>
            </Card>
          )}

          {archivedCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  Archived Courses ({archivedCourses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {archivedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
