import { AllergensPageImpl } from '@/app/(protected)/clinical-masters/allergens/_components/allergens-page-impl';

export default async function AllergensPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <AllergensPageImpl initialCreateOpen={initialCreateOpen} />;
}
