'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, Eye } from 'lucide-react';
import { useActionState, useState } from 'react';
import { updateCustomChallenge } from '../../actions';
import Link from 'next/link';
import type { ActionState } from '@/lib/auth/middleware';
import { VisibilityToggle } from '@/components/challenges/visibility-toggle';

interface EditChallengeFormProps {
  challenge: {
    id: number;
    name: string;
    content: string;
    isPublic: boolean;
  };
}

export function EditChallengeForm({ challenge }: EditChallengeFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateCustomChallenge,
    {}
  );
  const [content, setContent] = useState(challenge.content);
  const [showPreview, setShowPreview] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/challenges">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-white">
          Edit Challenge
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="id" value={challenge.id} />

            <div>
              <Label htmlFor="name" className="mb-2">
                Challenge Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                maxLength={255}
                placeholder="e.g., Git Rebase Workflow"
                defaultValue={(state as Record<string, string>).name || challenge.name}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A descriptive name for your challenge.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">
                  Challenge Content
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
              {showPreview ? (
                <div className="min-h-[200px] rounded-md border border-white/[0.06] bg-white/[0.03] p-4 font-mono text-sm whitespace-pre-wrap break-all">
                  {content || <span className="text-muted-foreground">Nothing to preview</span>}
                </div>
              ) : (
                <Textarea
                  id="content"
                  name="content"
                  required
                  rows={10}
                  className="font-mono"
                  placeholder="Type the content users will practice typing..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
              {showPreview && (
                <input type="hidden" name="content" value={content} />
              )}
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  This is the text users will type during the challenge.
                </p>
                <p className="text-xs text-muted-foreground">
                  {charCount} chars / {wordCount} words
                </p>
              </div>
            </div>

            <VisibilityToggle defaultChecked={challenge.isPublic} />

            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && (
              <p className="text-green-500 text-sm">{state.success}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href="/dashboard/challenges">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
