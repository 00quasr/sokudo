import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamOnboardingCourses,
  createTeamOnboardingCourse,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import type { OnboardingCourseWithDetails } from '@/lib/db/queries';

export interface TeamOnboardingCoursesResponse {
  courses: OnboardingCourseWithDetails[];
}

const createCourseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  challengeIds: z.array(z.number().int().positive()).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courses = await getTeamOnboardingCourses();

    const response: TeamOnboardingCoursesResponse = { courses };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching onboarding courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createTeamOnboardingCourse(parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User is not a member of any team') {
        return NextResponse.json(
          { error: 'No team found' },
          { status: 404 }
        );
      }
      if (error.message === 'Only team admins can create onboarding courses') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    console.error('Error creating onboarding course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
