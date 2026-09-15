import { RescheduleAppointmentPageImpl } from './_components/reschedule-appointment-page-impl';

export default async function RescheduleAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RescheduleAppointmentPageImpl appointmentId={Number(id)} />;
}
