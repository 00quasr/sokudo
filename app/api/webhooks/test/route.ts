import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';
import { dispatchWebhookEvent } from '@/lib/webhooks/deliver';

const testWebhookSchema = z.object({
  event: z.enum([
    'session.completed',
    'achievement.earned',
    'user.signed_up',
    'user.subscription_updated',
    'user.milestone_reached',
  ]),
  testData: z.record(z.unknown()).optional(),
});

/**
 * POST /api/webhooks/test
 * Trigger a test webhook event for the authenticated user.
 * Useful for Zapier integration testing.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'webhooks:test', limit: 5, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = testWebhookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.errors },
        { status: 400 }
      );
    }

    const { event, testData } = result.data;

    // Generate test data based on event type
    let payload: Record<string, unknown>;

    switch (event) {
      case 'session.completed':
        payload = testData ?? {
          sessionId: 999999,
          challengeId: 1,
          wpm: 85,
          rawWpm: 90,
          accuracy: 95,
          keystrokes: 250,
          errors: 12,
          durationMs: 60000,
          completedAt: new Date().toISOString(),
        };
        break;
      case 'achievement.earned':
        payload = testData ?? {
          achievementId: 1,
          slug: 'test_achievement',
          name: 'Test Achievement',
          description: 'This is a test achievement',
          icon: '🧪',
        };
        break;
      case 'user.signed_up':
        payload = testData ?? {
          userId: user.id,
          email: user.email,
          teamId: 1,
          signedUpAt: new Date().toISOString(),
          referralCode: null,
        };
        break;
      case 'user.subscription_updated':
        payload = testData ?? {
          teamId: 1,
          subscriptionId: 'sub_test123',
          status: 'active',
          planName: 'Pro Plan',
          productId: 'prod_test123',
          updatedAt: new Date().toISOString(),
        };
        break;
      case 'user.milestone_reached':
        payload = testData ?? {
          milestoneType: 'wpm',
          milestoneValue: 100,
          currentWpm: 105,
          sessionId: 999999,
          reachedAt: new Date().toISOString(),
        };
        break;
    }

    // Dispatch the test webhook
    await dispatchWebhookEvent(user.id, event, payload);

    return NextResponse.json({
      success: true,
      message: `Test webhook event "${event}" dispatched successfully`,
      payload,
    });
  } catch (error) {
    console.error('Error in POST /api/webhooks/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
