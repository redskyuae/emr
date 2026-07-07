import { notFound } from 'next/navigation';

import { PatientDetailImpl } from '@/app/(protected)/patients/[id]/_components/patient-detail-impl';

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const patientId = Number(id);

  if (!Number.isInteger(patientId) || patientId <= 0) {
    notFound();
  }

  return <PatientDetailImpl patientId={patientId} />;
}
