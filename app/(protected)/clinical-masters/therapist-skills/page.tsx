import { TherapistSkillsPageImpl } from './_Components/therapist-skills-page-impl';

export default async function TherapistSkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const createParam = params.create;
  const initialCreateOpen = Array.isArray(createParam)
    ? createParam.includes('1')
    : createParam === '1';

  return <TherapistSkillsPageImpl initialCreateOpen={initialCreateOpen} />;
}
