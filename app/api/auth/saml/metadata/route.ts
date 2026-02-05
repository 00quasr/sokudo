import { NextResponse } from 'next/server';
import { generateSamlMetadata } from '@/lib/auth/saml';

export async function GET() {
  const metadata = generateSamlMetadata();
  return new NextResponse(metadata, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
