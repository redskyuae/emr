import { ReasonsPageImpl } from '@/app/(protected)/appointment-masters/reasons/_components/reasons-page-impl';

export default async function AppointmentReasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <ReasonsPageImpl initialCreateOpen={initialCreateOpen} />;
}
