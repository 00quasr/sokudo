'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

interface AuthorizeInfo {
  client: { name: string; clientId: string };
  requestedScopes: string[];
  redirectUri: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  read: 'Read your typing sessions, stats, and profile',
  write: 'Create typing sessions and modify your data',
};

function OAuthAuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState<AuthorizeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const scope = searchParams.get('scope') ?? '';
  const state = searchParams.get('state') ?? '';
  const responseType = searchParams.get('response_type') ?? '';
  const codeChallenge = searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? '';

  useEffect(() => {
    async function fetchInfo() {
      try {
        const params = new URLSearchParams();
        params.set('response_type', responseType || 'code');
        params.set('client_id', clientId);
        params.set('redirect_uri', redirectUri);
        if (scope) params.set('scope', scope);
        if (state) params.set('state', state);
        if (codeChallenge) params.set('code_challenge', codeChallenge);
        if (codeChallengeMethod)
          params.set('code_challenge_method', codeChallengeMethod);

        const res = await fetch(`/api/oauth/authorize?${params.toString()}`);
        if (res.status === 302 || res.redirected) {
          // User not authenticated, redirect handled by browser
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error_description || data.error || 'Invalid request');
          return;
        }
        setInfo(data);
      } catch {
        setError('Failed to load authorization request');
      } finally {
        setLoading(false);
      }
    }

    if (clientId && redirectUri) {
      fetchInfo();
    } else {
      setError('Missing required parameters');
      setLoading(false);
    }
  }, [clientId, redirectUri, scope, state, responseType, codeChallenge, codeChallengeMethod]);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: scope || 'read',
          state: state || undefined,
          code_challenge: codeChallenge || undefined,
          code_challenge_method: codeChallengeMethod || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error_description || data.error || 'Authorization failed');
        setApproving(false);
        return;
      }

      // Redirect to the client with the authorization code
      window.location.href = data.redirectUrl;
    } catch {
      setError('Failed to authorize');
      setApproving(false);
    }
  }

  function handleDeny() {
    if (redirectUri) {
      const url = new URL(redirectUri);
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied the request');
      if (state) url.searchParams.set('state', state);
      window.location.href = url.toString();
    } else {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authorization Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Authorize Application</CardTitle>
          <p className="text-sm text-gray-500 mt-2">
            <span className="font-semibold text-gray-900">
              {info.client.name}
            </span>{' '}
            wants to access your Sokudo account
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              This application will be able to:
            </p>
            <ul className="space-y-2">
              {info.requestedScopes.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {SCOPE_DESCRIPTIONS[s] || s}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={approving}
          >
            Deny
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Authorize'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>}>
      <OAuthAuthorizeContent />
    </Suspense>
  );
}
