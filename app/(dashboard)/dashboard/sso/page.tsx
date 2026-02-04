'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

interface SamlConfig {
  id: number;
  teamId: number;
  entityId: string;
  ssoUrl: string;
  hasCertificate: boolean;
  sloUrl: string | null;
  nameIdFormat: string;
  signRequests: boolean;
  enabled: boolean;
  allowIdpInitiated: boolean;
  defaultRole: string;
  autoProvision: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SsoSettingsPage() {
  const [config, setConfig] = useState<SamlConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const [entityId, setEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [certificate, setCertificate] = useState('');
  const [sloUrl, setSloUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [autoProvision, setAutoProvision] = useState(true);
  const [allowIdpInitiated, setAllowIdpInitiated] = useState(false);
  const [defaultRole, setDefaultRole] = useState('member');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const spEntityId = `${baseUrl}/api/auth/saml/metadata`;
  const acsUrl = `${baseUrl}/api/auth/saml/callback`;

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/saml/config');
      if (res.status === 403) {
        setError('Only team owners can configure SSO settings.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError('Failed to load SSO configuration.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setEntityId(data.config.entityId);
        setSsoUrl(data.config.ssoUrl);
        setSloUrl(data.config.sloUrl || '');
        setEnabled(data.config.enabled);
        setAutoProvision(data.config.autoProvision);
        setAllowIdpInitiated(data.config.allowIdpInitiated);
        setDefaultRole(data.config.defaultRole);
      }
    } catch {
      setError('Failed to load SSO configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        entityId,
        ssoUrl,
        certificate: certificate || (config?.hasCertificate ? '___KEEP_EXISTING___' : ''),
        sloUrl: sloUrl || '',
        enabled,
        autoProvision,
        allowIdpInitiated,
        defaultRole,
      };

      const res = await fetch('/api/auth/saml/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save configuration.');
        return;
      }

      setConfig(data.config);
      setCertificate('');
      setSuccess('SSO configuration saved successfully.');
    } catch {
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete the SSO configuration? Users will no longer be able to sign in with SSO.')) {
      return;
    }

    setError('');
    setSuccess('');
    setDeleting(true);

    try {
      const res = await fetch('/api/auth/saml/config', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete configuration.');
        return;
      }

      setConfig(null);
      setEntityId('');
      setSsoUrl('');
      setCertificate('');
      setSloUrl('');
      setEnabled(false);
      setAutoProvision(true);
      setAllowIdpInitiated(false);
      setDefaultRole('member');
      setSuccess('SSO configuration deleted.');
    } catch {
      setError('Failed to delete configuration.');
    } finally {
      setDeleting(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  }

  if (loading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        SAML SSO Configuration
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Provider Details</CardTitle>
          <CardDescription>
            Provide these values to your identity provider when configuring SAML.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1 text-sm text-gray-600">Entity ID (Audience URI)</Label>
            <div className="flex items-center gap-2">
              <Input value={spEntityId} readOnly className="font-mono text-sm bg-gray-50" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(spEntityId, 'entityId')}
              >
                {copiedField === 'entityId' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label className="mb-1 text-sm text-gray-600">ACS URL (Reply URL)</Label>
            <div className="flex items-center gap-2">
              <Input value={acsUrl} readOnly className="font-mono text-sm bg-gray-50" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(acsUrl, 'acsUrl')}
              >
                {copiedField === 'acsUrl' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label className="mb-1 text-sm text-gray-600">Metadata URL</Label>
            <div className="flex items-center gap-2">
              <Input value={spEntityId} readOnly className="font-mono text-sm bg-gray-50" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(spEntityId, 'metadataUrl')}
              >
                {copiedField === 'metadataUrl' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Identity Provider Configuration</CardTitle>
          <CardDescription>
            Enter the SAML settings from your identity provider (Okta, Azure AD, OneLogin, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="idp-entity-id" className="mb-2">
                IdP Entity ID (Issuer)
              </Label>
              <Input
                id="idp-entity-id"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                required
                placeholder="https://idp.example.com/saml/metadata"
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="sso-url" className="mb-2">
                SSO URL (Login URL)
              </Label>
              <Input
                id="sso-url"
                type="url"
                value={ssoUrl}
                onChange={(e) => setSsoUrl(e.target.value)}
                required
                placeholder="https://idp.example.com/saml/sso"
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="certificate" className="mb-2">
                X.509 Certificate
                {config?.hasCertificate && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    (certificate configured - leave blank to keep existing)
                  </span>
                )}
              </Label>
              <textarea
                id="certificate"
                value={certificate}
                onChange={(e) => setCertificate(e.target.value)}
                required={!config?.hasCertificate}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCA...&#10;-----END CERTIFICATE-----"
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <Label htmlFor="slo-url" className="mb-2">
                SLO URL (Logout URL) <span className="text-gray-400 font-normal">- optional</span>
              </Label>
              <Input
                id="slo-url"
                type="url"
                value={sloUrl}
                onChange={(e) => setSloUrl(e.target.value)}
                placeholder="https://idp.example.com/saml/slo"
                className="font-mono text-sm"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Enable SSO</span>
                    <p className="text-xs text-gray-500">Allow team members to sign in via SAML SSO</p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={autoProvision}
                    onChange={(e) => setAutoProvision(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Auto-provision users</span>
                    <p className="text-xs text-gray-500">Automatically create accounts for new SSO users</p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allowIdpInitiated}
                    onChange={(e) => setAllowIdpInitiated(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Allow IdP-initiated SSO</span>
                    <p className="text-xs text-gray-500">Allow login initiated from the identity provider</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="default-role" className="mb-2">
                Default Role for New Users
              </Label>
              <select
                id="default-role"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {config ? 'Update Configuration' : 'Save Configuration'}
                  </>
                )}
              </Button>

              {config && (
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Configuration
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
