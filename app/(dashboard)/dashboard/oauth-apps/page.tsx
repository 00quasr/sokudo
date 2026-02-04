'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppWindow, Plus, Copy, Check, Trash2, Loader2 } from 'lucide-react';

type OAuthClientData = {
  id: number;
  clientId: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ScopeBadges({ scopes }: { scopes: string[] }) {
  return (
    <div className="flex gap-1">
      {scopes.map((scope) => (
        <span
          key={scope}
          className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
        >
          {scope}
        </span>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function CreateClientDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [isCreating, setIsCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setRedirectUri('');
    setScopes(['read']);
    setCreatedSecret(null);
    setCreatedClientId(null);
    setError(null);
    setIsCreating(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  }

  function toggleScope(scope: string) {
    if (scopes.includes(scope)) {
      const filtered = scopes.filter((s) => s !== scope);
      setScopes(filtered.length > 0 ? filtered : ['read']);
    } else {
      setScopes([...scopes, scope]);
    }
  }

  async function handleCreate() {
    setError(null);
    setIsCreating(true);
    try {
      const res = await fetch('/api/oauth/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          redirectUris: [redirectUri],
          scopes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create OAuth app');
        return;
      }

      const data = await res.json();
      setCreatedClientId(data.clientId);
      setCreatedSecret(data.clientSecret);
      onCreated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Register App
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>OAuth App Created</DialogTitle>
              <DialogDescription>
                Copy your client credentials now. The client secret won&apos;t be
                shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Client ID</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                  <code className="flex-1 text-sm font-mono break-all">
                    {createdClientId}
                  </code>
                  <CopyButton text={createdClientId!} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Client Secret</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
                  <code className="flex-1 text-sm font-mono break-all">
                    {createdSecret}
                  </code>
                  <CopyButton text={createdSecret} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register OAuth Application</DialogTitle>
              <DialogDescription>
                Register a third-party application that can request access to
                Sokudo user accounts via OAuth 2.0.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="app-name" className="mb-2">
                  Application Name
                </Label>
                <Input
                  id="app-name"
                  placeholder="e.g. My Typing Dashboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="redirect-uri" className="mb-2">
                  Redirect URI
                </Label>
                <Input
                  id="redirect-uri"
                  placeholder="https://example.com/callback"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  type="url"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Where users are redirected after authorization
                </p>
              </div>
              <div>
                <Label className="mb-2">Scopes</Label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'read',
                      label: 'Read',
                      description:
                        'Read typing sessions, stats, and profile data',
                    },
                    {
                      value: 'write',
                      label: 'Write',
                      description: 'Create sessions and modify user data',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(opt.value)}
                        onChange={() => toggleScope(opt.value)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-xs text-gray-500">
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleCreate}
                disabled={isCreating || !name.trim() || !redirectUri.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Register App'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OAuthClientRow({
  client,
  onDeactivate,
}: {
  client: OAuthClientData;
  onDeactivate: () => void;
}) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeactivate() {
    setIsDeactivating(true);
    try {
      const res = await fetch(`/api/oauth/clients/${client.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDeactivate();
      }
    } finally {
      setIsDeactivating(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{client.name}</span>
          {client.active ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Active
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Deactivated
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <code className="text-xs text-gray-500 font-mono">
            {client.clientId.slice(0, 20)}...
          </code>
          <ScopeBadges scopes={client.scopes} />
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {(client.redirectUris as string[]).map((uri) => (
            <span key={uri} className="mr-3">
              {uri}
            </span>
          ))}
        </div>
        <div className="flex gap-4 mt-1 text-xs text-gray-400">
          <span>Created {formatDate(client.createdAt)}</span>
        </div>
      </div>
      {client.active && (
        <div className="ml-4">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeactivating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isDeactivating}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Deactivate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OAuthAppsPage() {
  const { data, mutate } = useSWR<{ clients: OAuthClientData[] }>(
    '/api/oauth/clients',
    fetcher
  );
  const clients = data?.clients ?? [];
  const activeClients = clients.filter((c) => c.active);
  const inactiveClients = clients.filter((c) => !c.active);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          OAuth Apps
        </h1>
        <CreateClientDialog onCreated={() => mutate()} />
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Register third-party applications that can access Sokudo user data
        through the OAuth 2.0 authorization code flow. Users will be asked to
        grant permission before any data is shared.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="h-5 w-5" />
            Registered Apps ({activeClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeClients.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">
              No registered OAuth applications. Register one to get started.
            </p>
          ) : (
            activeClients.map((client) => (
              <OAuthClientRow
                key={client.id}
                client={client}
                onDeactivate={() => mutate()}
              />
            ))
          )}
        </CardContent>
      </Card>

      {inactiveClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">
              Deactivated Apps ({inactiveClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inactiveClients.map((client) => (
              <OAuthClientRow
                key={client.id}
                client={client}
                onDeactivate={() => mutate()}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
