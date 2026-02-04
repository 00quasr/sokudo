import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { getPublicCollectionById } from '@/lib/db/queries';

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (isNaN(collectionId)) notFound();

  const collection = await getPublicCollectionById(collectionId);
  if (!collection) notFound();

  const authorDisplay = collection.authorName || collection.authorEmail.split('@')[0];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Collections
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-2 text-lg text-gray-600">
            {collection.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {authorDisplay}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {collection.challenges.length} challenge{collection.challenges.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(collection.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {collection.challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              This collection is empty
            </h3>
            <p className="text-sm text-gray-500">
              No challenges have been added to this collection yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {collection.challenges.map((item, index) => (
            <Link key={item.id} href={`/challenges/community/${item.challengeId}`}>
              <Card className="transition-all hover:border-orange-300 hover:shadow-md cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6 text-right shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.challengeName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate font-mono mt-1">
                        {item.challengeContent.length > 100
                          ? item.challengeContent.slice(0, 100) + '...'
                          : item.challengeContent}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{item.challengeContent.length} chars</span>
                        {item.timesCompleted > 0 && (
                          <span>Practiced {item.timesCompleted} times</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
