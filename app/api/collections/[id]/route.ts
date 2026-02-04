import { NextRequest, NextResponse } from 'next/server';
import { getPublicCollectionById } from '@/lib/db/queries';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = apiRateLimit(request, { prefix: 'collections:detail' });
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const collectionId = parseInt(id, 10);
    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    const collection = await getPublicCollectionById(collectionId);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
