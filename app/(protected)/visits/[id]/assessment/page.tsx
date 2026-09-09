import { notFound } from 'next/navigation';

import { getStaticClinicianVisit } from '../../_data/static-clinician-visits';
import { ClinicianAssessmentPageImpl } from './_components/clinician-assessment-page-impl';

export default async function ClinicianAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const visit = getStaticClinicianVisit(Number(id));

  if (!visit) {
    notFound();
  }

  return <ClinicianAssessmentPageImpl visit={visit} />;
}
