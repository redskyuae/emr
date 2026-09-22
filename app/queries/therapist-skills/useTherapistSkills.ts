import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListTherapistSkillsResponse } from '@/app/api/v1/therapist-skills/types';
import { parseApiError } from '@/app/queries/api-error';

export type TherapistSkillListFilters = { page: number; limit: number; query?: string };
export const therapistSkillsBaseKey = ['therapist-skills'] as const;
export const therapistSkillListQueryKey = (filters: TherapistSkillListFilters) =>
  ['therapist-skills', 'list', filters] as const;
async function fetchTherapistSkills(
  filters: TherapistSkillListFilters
): Promise<ListTherapistSkillsResponse> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.query) params.set('query', filters.query);
  const response = await fetch(`/api/v1/therapist-skills?${params}`, {
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not load Therapist Skills');
  return response.json() as Promise<ListTherapistSkillsResponse>;
}
export function useTherapistSkillsQuery(filters: TherapistSkillListFilters) {
  return useQuery({
    queryKey: therapistSkillListQueryKey(filters),
    queryFn: () => fetchTherapistSkills(filters),
    placeholderData: keepPreviousData,
  });
}
