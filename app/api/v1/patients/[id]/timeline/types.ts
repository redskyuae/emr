import type { TimelineEvent } from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import type { CursorPaginated } from '@/app/api/lib/utils/types';

export type GetPatientTimelineResponse = CursorPaginated<TimelineEvent>;
