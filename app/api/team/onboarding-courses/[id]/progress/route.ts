import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getUser,
  markOnboardingStepComplete,
} from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

const markCompleteSchema = z.object({
  stepId: z.number().int().positive(),
  sessionId: z.number().int().positive().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'team:onboarding-courses:progress', limit: 30, windowMs: 60_000 });
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
    const parsed = markCompleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const progress = await markOnboardingStepComplete({
      courseId,
      stepId: parsed.data.stepId,
      sessionId: parsed.data.sessionId,
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User is not a member of any team') {
        return NextResponse.json(
          { error: 'No team found' },
          { status: 404 }
        );
      }
      if (error.message === 'Course step not found') {
        return NextResponse.json(
          { error: 'Step not found' },
          { status: 404 }
        );
      }
    }
    console.error('Error marking step complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
