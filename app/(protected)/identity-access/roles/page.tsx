import { RolesPageImpl } from '@/app/(protected)/identity-access/roles/_components/roles-page-impl';

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <RolesPageImpl initialCreateOpen={initialCreateOpen} />;
}
