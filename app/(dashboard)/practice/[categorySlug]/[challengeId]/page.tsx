import { redirect } from 'next/navigation';

// Individual challenge selection is deprecated - redirect to category for seamless practice
export default async function ChallengePage({
  params,
}: {
  params: Promise<{ categorySlug: string; challengeId: string }>;
}) {
  const { categorySlug } = await params;
  redirect(`/practice/${categorySlug}`);
}
