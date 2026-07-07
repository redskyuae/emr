import { notFound } from 'next/navigation';

import { PatientEditImpl } from '@/app/(protected)/patients/[id]/edit/_components/patient-edit-impl';

type PatientEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientEditPage({ params }: PatientEditPageProps) {
  const { id } = await params;
  const patientId = Number(id);

  if (!Number.isInteger(patientId) || patientId <= 0) {
    notFound();
  }

  return <PatientEditImpl patientId={patientId} />;
}
