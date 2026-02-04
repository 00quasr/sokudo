import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  getTeamOnboardingCourseById,
  updateTeamOnboardingCourse,
  deleteTeamOnboardingCourse,
  getOnboardingCourseProgress,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const updateCourseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await getTeamOnboardingCourseById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const progress = await getOnboardingCourseProgress(courseId);

    return NextResponse.json({ course, progress });
  } catch (error) {
    console.error('Error fetching onboarding course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses:detail', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateTeamOnboardingCourse(courseId, parsed.data);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User is not a member of any team') {
        return NextResponse.json(
          { error: 'No team found' },
          { status: 404 }
        );
      }
      if (error.message === 'Only team admins can update onboarding courses') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      if (error.message === 'Onboarding course not found') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
    }
    console.error('Error updating onboarding course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses:delete', limit: 30, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    await deleteTeamOnboardingCourse(courseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User is not a member of any team') {
        return NextResponse.json(
          { error: 'No team found' },
          { status: 404 }
        );
      }
      if (error.message === 'Only team admins can delete onboarding courses') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      if (error.message === 'Onboarding course not found') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
    }
    console.error('Error deleting onboarding course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
