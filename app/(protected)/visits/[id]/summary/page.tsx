import { notFound } from 'next/navigation';

import { VisitSummaryPageImpl } from './_components/visit-summary-page-impl';

export default async function VisitSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <VisitSummaryPageImpl visitId={Number(id)} />;
}
