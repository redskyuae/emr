import Link from 'next/link';
import { Activity, ClipboardList, NotebookPen } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  canRecordVitals: boolean;
  canCreateNote: boolean;
  onRecordVitals: () => void;
  onAddClinicalNote: () => void;
  onNursingHandoff: () => void;
};

export function VisitClinicalPanel({
  visit,
  chart,
  chartLoading,
  chartError,
  canRecordVitals,
  canCreateNote,
  onRecordVitals,
  onAddClinicalNote,
  onNursingHandoff,
}: Props) {
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const allergensQuery = useAllergensQuery({ limit: 100 });
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const vitals = (chart?.vitalSigns ?? []).filter((item) => item.visitId === visit.id);
  const notes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const activeAllergies = (chart?.allergies ?? []).filter((item) => item.status === 'active');
  const currentMedications = (chart?.medications ?? []).filter((item) => item.status === 'active');
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((item) => item.id === id)?.name ?? 'Clinical Note';
  const allergenName = (id: number | null) =>
    allergensQuery.data?.data.find((item) => item.id === id)?.name ?? 'Allergen';

  if (chartLoading) {
    return <p className="text-muted-foreground text-sm">Loading clinical records…</p>;
  }
  if (chartError) {
    return <p className="text-destructive text-sm">Clinical records could not be loaded.</p>;
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <Card className="shadow-fluent-2">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Vital Signs this Visit</CardTitle>
          {active && canRecordVitals ? (
            <Button type="button" size="sm" variant="outline" onClick={onRecordVitals}>
              <Activity className="size-4" />
              Record
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {vitals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No Vital Signs recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {vitals.map((item) => (
                <li key={item.id} className="rounded-md border p-3">
                  <p className="text-muted-foreground text-xs">
                    {new Date(item.recordedAt).toLocaleString()}
                  </p>
                  <p className="mt-1">
                    {[
                      item.systolic && item.diastolic
                        ? `BP ${item.systolic}/${item.diastolic}`
                        : null,
                      item.pulseBpm ? `Pulse ${item.pulseBpm}` : null,
                      item.temperatureC ? `Temp ${item.temperatureC}°C` : null,
                      item.spo2 ? `SpO₂ ${item.spo2}%` : null,
                      item.painScore !== null ? `Pain ${item.painScore}/10` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Recorded'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Clinical Notes</CardTitle>
          {active && canCreateNote ? (
            <Button type="button" size="sm" variant="outline" onClick={onAddClinicalNote}>
              <NotebookPen className="size-4" />
              Add note
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No Clinical Notes authored during this Visit.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{noteTypeName(note.noteTypeId)}</p>
                    <Badge variant={note.status === 'signed' ? 'outline' : 'secondary'}>
                      {note.status === 'signed' ? 'Signed' : 'Draft'}
                    </Badge>
                  </div>
                  {note.subjective ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2">{note.subjective}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Allergies & medications</CardTitle>
          {active && canCreateNote ? (
            <Button type="button" size="sm" variant="outline" onClick={onNursingHandoff}>
              Nursing handoff
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeAllergies.length === 0 && currentMedications.length === 0 ? (
            <p className="text-muted-foreground">
              No active allergies or current medications on record.
            </p>
          ) : (
            <>
              <div>
                <p className="font-medium">Active allergies ({activeAllergies.length})</p>
                {activeAllergies.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {activeAllergies.map((allergy) => (
                      <li key={allergy.id}>
                        {allergy.substance ?? allergenName(allergy.allergenId)}
                        {allergy.reaction ? ` · ${allergy.reaction}` : ''}
                        {allergy.severity === 'severe' ? ' · Severe' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">None recorded.</p>
                )}
              </div>
              <div>
                <p className="font-medium">Current medications ({currentMedications.length})</p>
                {currentMedications.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {currentMedications.map((medication) => (
                      <li key={medication.id}>
                        {medication.drugName}
                        {medication.dose ? ` · ${medication.dose}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">None recorded.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle className="text-base">Patient Chart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Every Visit, Clinical Note and Treatment Plan for this Patient in one timeline.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/patients/${visit.patient.id}`}>
              <ClipboardList className="size-4" />
              Open longitudinal chart
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
