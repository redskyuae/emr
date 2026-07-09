import { notFound } from 'next/navigation';

import { VisitDetailImpl } from './_components/visit-detail-impl';

type VisitDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VisitDetailPage({ params }: VisitDetailPageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <VisitDetailImpl visitId={Number(id)} />;
}
