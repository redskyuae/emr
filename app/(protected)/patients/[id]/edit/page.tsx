import { notFound } from 'next/navigation';

import { PatientEditImpl } from '@/app/(protected)/patients/[id]/edit/_components/patient-edit-impl';
import { parsePatientIdParam } from '@/app/(protected)/patients/_utils/parse-patient-id';

type PatientEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientEditPage({ params }: PatientEditPageProps) {
  const { id } = await params;
  const patientId = parsePatientIdParam(id);

  if (patientId === null) {
    notFound();
  }

  return <PatientEditImpl patientId={patientId} />;
}
