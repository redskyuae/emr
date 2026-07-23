import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import type { GetPatientTimelineResponse } from '@/app/api/v1/patients/[id]/timeline/types';
import type {
  TimelineEvent,
  TimelineFeed,
} from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import { parseApiError } from '@/app/queries/api-error';

// The feed filter is part of the key: a filtered page set is a different list, and
// reusing cached pages across filters would splice unrelated results together.
export const patientTimelineQueryKey = (patientId: number, feed: TimelineFeed) =>
  ['patients', 'detail', patientId, 'timeline', feed] as const;

async function fetchPatientTimeline(
  patientId: number,
  feed: TimelineFeed,
  cursor: string | null
): Promise<GetPatientTimelineResponse> {
  const params = new URLSearchParams({ feed });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`/api/v1/patients/${patientId}/timeline?${params.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Patient Timeline');
  }

  return response.json() as Promise<GetPatientTimelineResponse>;
}

export type TimelineDayGroup = {
  dayKey: string;
  events: TimelineEvent[];
};

// Instants arrive as UTC and are grouped in the viewer's browser zone — the server
// sends no local date (ADR 0041). The key is a locale-independent y-m-d so grouping
// never depends on how a locale happens to format a date.
function browserDayKey(isoInstant: string) {
  const occurredAt = new Date(isoInstant);
  const month = String(occurredAt.getMonth() + 1).padStart(2, '0');
  const day = String(occurredAt.getDate()).padStart(2, '0');

  return `${occurredAt.getFullYear()}-${month}-${day}`;
}

// Grouping is derived in `select` rather than a component `useMemo`, so it
// recomputes only when the cached pages actually change.
function transformPatientTimeline(
  data: InfiniteData<GetPatientTimelineResponse>
): TimelineDayGroup[] {
  const groups: TimelineDayGroup[] = [];

  for (const page of data.pages) {
    for (const event of page.data) {
      const dayKey = browserDayKey(event.occurredAt);
      const currentGroup = groups.at(-1);

      if (currentGroup?.dayKey === dayKey) {
        currentGroup.events.push(event);
      } else {
        groups.push({ dayKey, events: [event] });
      }
    }
  }

  return groups;
}

export function usePatientTimelineQuery(patientId: number, feed: TimelineFeed) {
  return useInfiniteQuery({
    queryKey: patientTimelineQueryKey(patientId, feed),
    queryFn: ({ pageParam }) => fetchPatientTimeline(patientId, feed, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    select: transformPatientTimeline,
  });
}
