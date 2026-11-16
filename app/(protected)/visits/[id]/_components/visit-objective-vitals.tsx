import { Activity } from 'lucide-react';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { Button } from '@/components/ui/button';

import { VisitVitalTrends } from './visit-vital-trends';

/** This Visit's Vital Signs, compared with the readings taken before it. */
export function VisitObjectiveVitals({
  visitId,
  readings,
  loading,
  error,
  canRecord,
  onRecord,
}: {
  visitId: number;
  readings: PatientVitalSign[];
  loading: boolean;
  error: boolean;
  canRecord: boolean;
  onRecord: () => void;
}) {
  const visitReadings = readings.filter((reading) => reading.visitId === visitId);
  const lastAt = Math.max(
    ...visitReadings.map((reading) => new Date(reading.recordedAt).getTime())
  );
  // Readings from later Visits must not be compared against this one.
  const upToThisVisit = visitReadings.length
    ? readings.filter((reading) => new Date(reading.recordedAt).getTime() <= lastAt)
    : [];

  return (
    <section
      aria-labelledby="objective-vitals"
      className="border-l-chart-4 space-y-3 rounded-lg border border-l-4 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="objective-vitals" className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="text-chart-4 size-4" aria-hidden="true" />
          Vital Signs
        </h3>
        {canRecord ? (
          <Button type="button" size="sm" variant="outline" onClick={onRecord}>
            <Activity className="size-4" />
            {visitReadings.length ? 'Record again' : 'Record Vital Signs'}
          </Button>
        ) : null}
      </div>
      <VisitVitalTrends
        readings={upToThisVisit}
        loading={loading}
        error={error}
        emptyText="Not recorded for this Visit yet."
      />
    </section>
  );
}
