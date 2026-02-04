'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Upload,
  ArrowLeft,
  FileText,
  Layers,
} from 'lucide-react';
import { useActionState, useState, useMemo } from 'react';
import { importChallengesFromText } from '../actions';
import { parseShellText } from '@/lib/import/parse-shell-text';
import Link from 'next/link';
import type { ActionState } from '@/lib/auth/middleware';

export default function ImportChallengesPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    importChallengesFromText,
    {}
  );
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'lines' | 'block'>('lines');

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    return parseShellText(text, mode);
  }, [text, mode]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/challenges">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Import Challenges from Text
        </h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paste Shell History or Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={formAction}>
            <div>
              <Label htmlFor="text" className="mb-2">
                Text to Import
              </Label>
              <Textarea
                id="text"
                name="text"
                required
                rows={12}
                className="font-mono"
                placeholder={`Paste your shell history, .bashrc aliases, or command list here...\n\nExamples:\n  git add . && git commit -m "update"\n  docker build -t myapp .\n  kubectl get pods -n production\n  alias ll='ls -la'\n  export PATH="$HOME/bin:$PATH"`}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports shell history (with line numbers), .bashrc/.zshrc snippets,
                and plain command lists. Comments and duplicates are automatically skipped.
              </p>
            </div>

            <div>
              <Label className="mb-2">Import Mode</Label>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setMode('lines')}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                    mode === 'lines'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  One challenge per line
                </button>
                <button
                  type="button"
                  onClick={() => setMode('block')}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                    mode === 'block'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Entire text as one challenge
                </button>
              </div>
              <input type="hidden" name="mode" value={mode} />
            </div>

            {preview && preview.challenges.length > 0 && (
              <div>
                <Label className="mb-2">
                  Preview ({preview.challenges.length} challenge{preview.challenges.length !== 1 ? 's' : ''})
                  {preview.skippedLines > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      {preview.skippedLines} line{preview.skippedLines !== 1 ? 's' : ''} skipped
                    </span>
                  )}
                </Label>
                <div className="mt-1 max-h-64 overflow-y-auto rounded-md border bg-gray-50 divide-y">
                  {preview.challenges.map((challenge, i) => (
                    <div key={i} className="px-3 py-2">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {challenge.name}
                      </p>
                      <p className="font-mono text-sm whitespace-pre-wrap break-all">
                        {challenge.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview && preview.challenges.length === 0 && text.trim().length > 0 && (
              <p className="text-sm text-muted-foreground">
                No valid challenges found. Lines that are too short, comments, or duplicates are skipped.
              </p>
            )}

            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state.success && (
              <div>
                <p className="text-green-500 text-sm">{state.success}</p>
                <Link href="/dashboard/challenges" className="text-sm text-orange-600 hover:underline mt-1 inline-block">
                  View your challenges &rarr;
                </Link>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isPending || !text.trim() || (preview?.challenges.length ?? 0) === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {preview?.challenges.length ?? 0} Challenge{(preview?.challenges.length ?? 0) !== 1 ? 's' : ''}
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
