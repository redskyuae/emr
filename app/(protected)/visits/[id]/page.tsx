import { notFound } from 'next/navigation';

import { VisitDetailImpl } from './_components/visit-detail-impl';

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <VisitDetailImpl visitId={Number(id)} />;
}
