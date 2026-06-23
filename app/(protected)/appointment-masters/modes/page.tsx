import { ModesPageImpl } from '@/app/(protected)/appointment-masters/modes/_components/modes-page-impl';

export default async function AppointmentModesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const addParam = params.add;
  const initialAddOpen = Array.isArray(addParam) ? addParam.includes('1') : addParam === '1';

  return <ModesPageImpl initialAddOpen={initialAddOpen} />;
}
