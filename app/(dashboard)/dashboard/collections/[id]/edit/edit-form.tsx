'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useActionState } from 'react';
import { updateCollection } from '../../actions';
import Link from 'next/link';
import type { ActionState } from '@/lib/auth/middleware';
import { VisibilityToggle } from '@/components/challenges/visibility-toggle';

interface EditCollectionFormProps {
  collection: {
    id: number;
    name: string;
    description: string | null;
    isPublic: boolean;
  };
}

export function EditCollectionForm({ collection }: EditCollectionFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateCollection,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/collections/${collection.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Edit Collection
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="id" value={collection.id} />

            <div>
              <Label htmlFor="name" className="mb-2">
                Collection Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                maxLength={255}
                defaultValue={collection.name}
              />
            </div>

            <div>
              <Label htmlFor="description" className="mb-2">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                maxLength={1000}
                defaultValue={collection.description ?? ''}
              />
            </div>

            <VisibilityToggle defaultChecked={collection.isPublic} />

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
              <Link href={`/dashboard/collections/${collection.id}`}>
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
