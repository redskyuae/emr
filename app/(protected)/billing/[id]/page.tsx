import { notFound } from 'next/navigation';

import { InvoiceDetailImpl } from './_components/invoice-detail-impl';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <InvoiceDetailImpl invoiceId={Number(id)} />;
}
