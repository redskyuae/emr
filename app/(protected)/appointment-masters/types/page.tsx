import { TypesPageImpl } from '@/app/(protected)/appointment-masters/types/_components/types-page-impl';

export default async function AppointmentTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <TypesPageImpl initialCreateOpen={initialCreateOpen} />;
}
