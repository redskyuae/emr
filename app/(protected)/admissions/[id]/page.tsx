import { notFound } from 'next/navigation';

import { AdmissionDetailImpl } from './_components/admission-detail-impl';

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <AdmissionDetailImpl admissionId={Number(id)} />;
}
