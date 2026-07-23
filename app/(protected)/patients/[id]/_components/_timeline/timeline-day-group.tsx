'use client';

import type { TimelineDayGroup } from '@/app/queries/patients/timeline/usePatientTimeline';
import { formatTimelineDayLabel } from '@/app/(protected)/patients/[id]/_utils/timeline-presentation';

import { TimelineEntry } from './timeline-entry';

export function TimelineDayGroupSection({
  group,
  patientId,
}: {
  group: TimelineDayGroup;
  patientId: number;
}) {
  return (
    <section className="space-y-2">
      <h3 className="bg-background/95 text-muted-foreground sticky top-0 z-10 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur">
        {formatTimelineDayLabel(group.dayKey)}
      </h3>

      <ul className="space-y-2">
        {group.events.map((event) => (
          <TimelineEntry
            key={`${event.sourceType}-${event.eventType}-${event.sourceId}`}
            event={event}
            patientId={patientId}
          />
        ))}
      </ul>
    </section>
  );
}
