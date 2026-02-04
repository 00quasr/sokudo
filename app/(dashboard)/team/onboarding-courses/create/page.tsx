import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, ArrowLeft } from 'lucide-react';
import { getTeamForUser, getUser, getCategories } from '@/lib/db/queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreateOnboardingCourseForm } from './create-form';

export default async function CreateOnboardingCoursePage() {
  const [team, currentUser, allCategories] = await Promise.all([
    getTeamForUser(),
    getUser(),
    getCategories(),
  ]);

  if (!team || !currentUser) {
    redirect('/team/onboarding-courses');
  }

  const isAdmin = team.teamMembers?.some(
    (m) => m.user.id === currentUser.id && (m.role === 'owner' || m.role === 'admin')
  );

  if (!isAdmin) {
    redirect('/team/onboarding-courses');
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <Link
        href="/team/onboarding-courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Create Onboarding Course
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            New Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOnboardingCourseForm categories={allCategories} />
        </CardContent>
      </Card>
    </section>
  );
}
