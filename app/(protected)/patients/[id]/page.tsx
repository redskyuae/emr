import { notFound } from 'next/navigation';

import { PatientDetailImpl } from '@/app/(protected)/patients/[id]/_components/patient-detail-impl';
import { parsePatientIdParam } from '@/app/(protected)/patients/_utils/parse-patient-id';

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  const patientId = parsePatientIdParam(id);

  if (patientId === null) {
    notFound();
  }

  return <PatientDetailImpl patientId={patientId} />;
}
