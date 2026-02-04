import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { getUserCollections } from '@/lib/db/queries';
import { DeleteCollectionButton } from './delete-button';

export default async function CollectionsPage() {
  const collections = await getUserCollections();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Challenge Collections
        </h1>
        <Link href="/dashboard/collections/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            New Collection
          </Button>
        </Link>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <FolderOpen className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No collections yet
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Group related challenges into collections to organize your practice sessions.
            </p>
            <Link href="/dashboard/collections/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Collection
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {collections.map((collection) => (
            <Card key={collection.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {collection.name}
                    </h3>
                    {collection.isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{collection.challengeCount} challenge{collection.challengeCount !== 1 ? 's' : ''}</span>
                    <span>
                      Created {collection.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link href={`/dashboard/collections/${collection.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/collections/${collection.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteCollectionButton collectionId={collection.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
