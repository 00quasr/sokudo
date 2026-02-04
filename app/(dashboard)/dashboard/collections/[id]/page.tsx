import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Lock, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getCollectionById } from '@/lib/db/queries';
import { RemoveChallengeButton } from './remove-challenge-button';
import { AddChallengeForm } from './add-challenge-form';

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) notFound();

  const collection = await getCollectionById(collectionId);
  if (!collection) notFound();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              {collection.name}
            </h1>
            {collection.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {collection.description}
            </p>
          )}
        </div>
        <Link href={`/dashboard/collections/${collection.id}/edit`}>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </Link>
      </div>

      <AddChallengeForm collectionId={collection.id} />

      {collection.challenges.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No challenges in this collection
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Add challenges to this collection using the form above, or create new custom challenges first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 mt-4">
          {collection.challenges.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-mono text-muted-foreground w-6 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.challengeName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate font-mono">
                      {item.challengeContent.length > 80
                        ? item.challengeContent.slice(0, 80) + '...'
                        : item.challengeContent}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{item.challengeContent.length} chars</span>
                      <span>Completed {item.timesCompleted} times</span>
                    </div>
                  </div>
                </div>
                <RemoveChallengeButton
                  collectionId={collection.id}
                  challengeId={item.challengeId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
