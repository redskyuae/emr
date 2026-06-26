import { ModesPageImpl } from '@/app/(protected)/appointment-masters/modes/_components/modes-page-impl';

export default async function AppointmentModesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <ModesPageImpl initialCreateOpen={initialCreateOpen} />;
}
