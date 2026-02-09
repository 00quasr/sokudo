import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in?redirect=/practice');
  }

  return <>{children}</>;
}
