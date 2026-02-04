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
import { Key, Plus, Copy, Check, Trash2, Loader2 } from 'lucide-react';

type ApiKeyData = {
  id: number;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Read', description: 'Read-only access to your data' },
  { value: 'write', label: 'Write', description: 'Create, update, and delete data' },
  { value: '*', label: 'Full Access', description: 'Unrestricted access to all endpoints' },
] as const;

const EXPIRY_OPTIONS = [
  { value: 0, label: 'No expiration' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
] as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function KeyStatus({ apiKey }: { apiKey: ApiKeyData }) {
  if (apiKey.revokedAt) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Revoked</span>;
  }
  if (isExpired(apiKey.expiresAt)) {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Expired</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>;
}

function ScopeBadges({ scopes }: { scopes: string[] }) {
  return (
    <div className="flex gap-1">
      {(scopes as string[]).map((scope) => (
        <span
          key={scope}
          className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
        >
          {scope === '*' ? 'full' : scope}
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

function CreateKeyDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setScopes(['read']);
    setExpiresInDays(0);
    setCreatedKey(null);
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
    if (scope === '*') {
      setScopes(['*']);
      return;
    }
    const newScopes = scopes.filter((s) => s !== '*');
    if (newScopes.includes(scope)) {
      const filtered = newScopes.filter((s) => s !== scope);
      setScopes(filtered.length > 0 ? filtered : ['read']);
    } else {
      setScopes([...newScopes, scope]);
    }
  }

  async function handleCreate() {
    setError(null);
    setIsCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          scopes,
          ...(expiresInDays > 0 ? { expiresInDays } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create API key');
        return;
      }

      const data = await res.json();
      setCreatedKey(data.key);
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
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy your API key now. You won&apos;t be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border">
              <code className="flex-1 text-sm font-mono break-all">{createdKey}</code>
              <CopyButton text={createdKey} />
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                API keys allow external applications to access the Sokudo API on your behalf.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name" className="mb-2">
                  Name
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. VS Code Extension"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div>
                <Label className="mb-2">Permissions</Label>
                <div className="space-y-2">
                  {SCOPE_OPTIONS.map((opt) => (
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
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="expiry" className="mb-2">
                  Expiration
                </Label>
                <select
                  id="expiry"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                disabled={isCreating || !name.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Key'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyRow({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKeyData;
  onRevoke: (id: number) => void;
}) {
  const [isRevoking, setIsRevoking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isActive = !apiKey.revokedAt && !isExpired(apiKey.expiresAt);

  async function handleRevoke() {
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/keys/${apiKey.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRevoke(apiKey.id);
      }
    } finally {
      setIsRevoking(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{apiKey.name}</span>
          <KeyStatus apiKey={apiKey} />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <code className="text-xs text-gray-500 font-mono">{apiKey.keyPrefix}...</code>
          <ScopeBadges scopes={apiKey.scopes as string[]} />
        </div>
        <div className="flex gap-4 mt-1 text-xs text-gray-400">
          <span>Created {formatDate(apiKey.createdAt)}</span>
          <span>Last used {formatDate(apiKey.lastUsedAt)}</span>
          {apiKey.expiresAt && <span>Expires {formatDate(apiKey.expiresAt)}</span>}
        </div>
      </div>
      {isActive && (
        <div className="ml-4">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRevoking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isRevoking}
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
              Revoke
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiKeysPage() {
  const { data, mutate } = useSWR<{ keys: ApiKeyData[] }>('/api/keys', fetcher);
  const keys = data?.keys ?? [];
  const activeKeys = keys.filter((k) => !k.revokedAt && !isExpired(k.expiresAt));
  const inactiveKeys = keys.filter((k) => k.revokedAt || isExpired(k.expiresAt));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          API Keys
        </h1>
        <CreateKeyDialog onCreated={() => mutate()} />
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Manage API keys for external applications. Keys authenticate requests to the{' '}
        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/api/v1</code> endpoints using Bearer token authentication.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active Keys ({activeKeys.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeKeys.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">
              No active API keys. Create one to get started.
            </p>
          ) : (
            activeKeys.map((apiKey) => (
              <ApiKeyRow
                key={apiKey.id}
                apiKey={apiKey}
                onRevoke={() => mutate()}
              />
            ))
          )}
        </CardContent>
      </Card>

      {inactiveKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">
              Revoked / Expired Keys ({inactiveKeys.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inactiveKeys.map((apiKey) => (
              <ApiKeyRow
                key={apiKey.id}
                apiKey={apiKey}
                onRevoke={() => mutate()}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
