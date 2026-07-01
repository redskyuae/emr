import { CancelledReasonsPageImpl } from './_components/cancelled-reasons-page-impl';

export default async function AppointmentCancelledReasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <CancelledReasonsPageImpl initialCreateOpen={initialCreateOpen} />;
}
