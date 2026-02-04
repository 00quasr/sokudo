import { NextRequest } from 'next/server';

/**
 * Google OAuth callback handler
 * This route is called by Google after user authenticates
 * NextAuth v5 handles the actual callback through the [...nextauth] route
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Build the callback URL for NextAuth to handle
  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (state) params.set('state', state);
  if (error) params.set('error', error);

  // Redirect to NextAuth's internal callback handler
  const callbackUrl = `/api/auth/callback/google?${params.toString()}`;
  return Response.redirect(new URL(callbackUrl, request.url));
}
