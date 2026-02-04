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
import { generatePersonalizedPractice } from '@/lib/practice/personalized';

const querySchema = z.object({
  maxChallenges: z.coerce.number().int().min(1).max(10).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'practice:personalized' });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      maxChallenges: searchParams.get('maxChallenges') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { maxChallenges } = queryResult.data;

    const [keyData, errorPatterns, problemSeqs] = await Promise.all([
      getKeyAccuracyForUser(user.id),
      getCharErrorPatternsForUser(user.id),
      getProblemSequences(user.id, 10),
    ]);

    const report = analyzeWeaknesses(keyData, errorPatterns, problemSeqs);
    const practiceSet = generatePersonalizedPractice(report, { maxChallenges });

    return NextResponse.json(practiceSet);
  } catch (error) {
    console.error('Error generating personalized practice:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized practice' },
      { status: 500 }
    );
  }
}
