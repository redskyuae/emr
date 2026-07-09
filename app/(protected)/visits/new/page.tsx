import { VisitCheckInImpl } from './_components/visit-check-in-impl';

export default async function VisitNewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const patientParam = params.patient;
  const patientIdRaw = Array.isArray(patientParam) ? patientParam[0] : patientParam;
  const initialPatientId = patientIdRaw && /^\d+$/.test(patientIdRaw) ? Number(patientIdRaw) : null;

  return <VisitCheckInImpl initialPatientId={initialPatientId} />;
}
