import { notFound } from 'next/navigation';
import { getCollectionById } from '@/lib/db/queries';
import { EditCollectionForm } from './edit-form';

export default async function EditCollectionPage({
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
    <EditCollectionForm
      collection={{
        id: collection.id,
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic,
      }}
    />
  );
}
