import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  getUser,
  getKeyAccuracyForUser,
  getCharErrorPatternsForUser,
  getProblemSequences,
} from '@/lib/db/queries';
import { analyzeWeaknesses } from '@/lib/weakness/analyze';
import {
  generateAIPersonalizedPractice,
  generatePersonalizedPractice,
  type FocusArea,
} from '@/lib/practice/personalized';

const VALID_FOCUS_AREAS: FocusArea[] = [
  'weak-keys',
  'common-typos',
  'slow-keys',
  'problem-sequences',
  'mixed',
];

const querySchema = z.object({
  maxChallenges: z.coerce.number().int().min(1).max(10).default(5),
  focusArea: z
    .enum(['weak-keys', 'common-typos', 'slow-keys', 'problem-sequences', 'mixed'])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:personalized:generate', limit: 10, windowMs: 60_000 });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = querySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { maxChallenges, focusArea } = parseResult.data;

    const [keyData, errorPatterns, problemSeqs] = await Promise.all([
      getKeyAccuracyForUser(user.id),
      getCharErrorPatternsForUser(user.id),
      getProblemSequences(user.id, 10),
    ]);

    const report = analyzeWeaknesses(keyData, errorPatterns, problemSeqs);

    // Try AI generation, fall back to static generation
    try {
      const practiceSet = await generateAIPersonalizedPractice(report, {
        maxChallenges,
        focusArea,
      });
      return NextResponse.json({ ...practiceSet, source: 'ai' });
    } catch {
      // AI not configured or failed - fall back to static
      const practiceSet = generatePersonalizedPractice(report, { maxChallenges });
      return NextResponse.json({ ...practiceSet, source: 'static' });
    }
  } catch (error) {
    console.error('Error generating AI personalized practice:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized practice' },
      { status: 500 }
    );
  }
}
