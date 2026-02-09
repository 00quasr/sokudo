import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export default async function RaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in?redirect=/race');
  }

  return <>{children}</>;
}
