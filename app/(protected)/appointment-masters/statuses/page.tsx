import { StatusesPageImpl } from '@/app/(protected)/appointment-masters/statuses/_components/statuses-page-impl';

export default async function AppointmentStatusesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <StatusesPageImpl initialCreateOpen={initialCreateOpen} />;
}
