import { DiagnosisCodesPageImpl } from '@/app/(protected)/clinical-masters/diagnosis-codes/_components/diagnosis-codes-page-impl';

export default async function DiagnosisCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <DiagnosisCodesPageImpl initialCreateOpen={initialCreateOpen} />;
}
