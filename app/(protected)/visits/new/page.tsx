import { CreateVisitPageImpl } from './_components/create-visit-page-impl';

export default async function CreateVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string | string[] }>;
}) {
  const { appointmentId: rawAppointmentId } = await searchParams;
  const parsedAppointmentId =
    typeof rawAppointmentId === 'string' && /^[1-9]\d*$/.test(rawAppointmentId)
      ? Number(rawAppointmentId)
      : null;
  const appointmentId =
    parsedAppointmentId !== null && Number.isSafeInteger(parsedAppointmentId)
      ? parsedAppointmentId
      : null;

  return <CreateVisitPageImpl key={appointmentId ?? 'new'} initialAppointmentId={appointmentId} />;
}
