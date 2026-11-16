import { Activity, PencilLine } from 'lucide-react';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { Button } from '@/components/ui/button';

import { VisitVitalTrends } from './visit-vital-trends';

function readingSummary(reading: PatientVitalSign) {
  const parts = [
    reading.systolic !== null && reading.diastolic !== null
      ? `BP ${reading.systolic}/${reading.diastolic}`
      : null,
    reading.pulseBpm !== null ? `Pulse ${reading.pulseBpm}` : null,
    reading.temperatureC !== null ? `${reading.temperatureC} °C` : null,
    reading.spo2 !== null ? `SpO₂ ${reading.spo2}%` : null,
    reading.weightKg !== null ? `${reading.weightKg} kg` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'Reading';
}

/** This Visit's Vital Signs, compared with the readings taken before it. */
export function VisitObjectiveVitals({
  visitId,
  readings,
  timeZone,
  loading,
  error,
  canRecord,
  onRecord,
  onAmend,
}: {
  visitId: number;
  readings: PatientVitalSign[];
  /** The Tenant's time zone, so reading times match the clinic clock. */
  timeZone?: string;
  loading: boolean;
  error: boolean;
  canRecord: boolean;
  onRecord: () => void;
  /** Present only on a Completed Visit the user may amend. */
  onAmend?: (vitalId: number) => void;
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
      {onAmend && !loading && !error && visitReadings.length ? (
        <ul className="divide-y rounded-md border text-sm" aria-label="Readings this Visit">
          {visitReadings.map((reading) => {
            const time = new Date(reading.recordedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              timeZone,
            });

            return (
              <li key={reading.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="text-muted-foreground font-mono text-xs">{time}</span>{' '}
                  <span className="font-mono text-xs tabular-nums">{readingSummary(reading)}</span>
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  aria-label={`Amend the ${time} reading`}
                  onClick={() => onAmend(reading.id)}
                >
                  <PencilLine className="size-3" />
                  Amend
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
