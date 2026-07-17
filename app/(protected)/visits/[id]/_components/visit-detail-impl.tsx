'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import { Activity, CheckCircle2, NotebookPen, PlayCircle, Save, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { AllergyBanner } from '@/app/(protected)/patients/[id]/_components/_chart/allergy-banner';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { usePatientChartQuery } from '@/app/queries/patients/chart/usePatientChart';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { useStartConsultation } from '@/app/queries/visits/useStartConsultation';
import { useUpdateVisit } from '@/app/queries/visits/useUpdateVisit';
import { useVisit } from '@/app/queries/visits/useVisit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { CancelVisitDialog } from '../../_components/_modals/cancel-visit-dialog';
import { isActiveVisit, visitStatusPresentation } from '../../_utils/visit-status';
import { AddNoteSheet } from './_sheets/add-note-sheet';
import { RecordVitalsSheet } from './_sheets/record-vitals-sheet';
import { VisitStatusTimeline } from './visit-status-timeline';

export function VisitDetailImpl({ visitId }: { visitId: number }) {
  const [captureParam, setCaptureParam] = useQueryState('capture');
  const { data: visit } = useVisit(visitId);
  const chartQuery = usePatientChartQuery(visit.patient.id);
  const allergensQuery = useAllergensQuery({ limit: 100 });
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState(visit.chiefComplaint ?? '');
  const [remarks, setRemarks] = useState(visit.remarks ?? '');

  const startMutation = useStartConsultation();
  const completeMutation = useCompleteVisit();
  const updateMutation = useUpdateVisit();

  const status = visitStatusPresentation(visit.status);
  const active = isActiveVisit(visit.status);

  const allergenName = (id: number) =>
    allergensQuery.data?.data.find((allergen) => allergen.id === id)?.name ?? 'Allergen';
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((noteType) => noteType.id === id)?.name ?? 'Note';

  const visitVitals = (chartQuery.data?.vitalSigns ?? []).filter(
    (vitalSign) => vitalSign.visitId === visit.id
  );
  const visitNotes = (chartQuery.data?.clinicalNotes ?? []).filter(
    (note) => note.visitId === visit.id
  );

  const isDirty =
    chiefComplaint !== (visit.chiefComplaint ?? '') || remarks !== (visit.remarks ?? '');

  async function runTransition(action: 'start' | 'complete') {
    try {
      if (action === 'start') {
        await startMutation.mutateAsync(visit.id);
        toast.success(`${visit.visitNumber} is now in consultation.`);
      } else {
        await completeMutation.mutateAsync(visit.id);
        toast.success(`${visit.visitNumber} completed.`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleSaveDetails() {
    try {
      await updateMutation.mutateAsync({
        id: visit.id,
        request: {
          chiefComplaint: chiefComplaint || undefined,
          remarks: remarks || undefined,
        },
      });
      toast.success('Visit updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* The same safety banner the Patient Chart shows — the consulting
            Doctor must see allergies without leaving the Visit. */}
        <AllergyBanner allergies={chartQuery.data?.allergies ?? []} allergenName={allergenName} />

        <Card className="shadow-fluent-2">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{visit.visitNumber}</h2>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-md text-sm font-semibold tabular-nums">
                    {visit.queueToken}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {visit.visitDate} · {visit.visitType.name} · {visit.doctor.name}
                  {visit.appointment ? ` · ${visit.appointment.bookingNumber}` : ' · Walk-in'}
                </p>
                <Link
                  href={`/patients/${visit.patient.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  <User className="size-4" />
                  {visit.patient.firstName} {visit.patient.lastName} · {visit.patient.mrn}
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {visit.status === 'CHECKED_IN' ? (
                  <Button
                    type="button"
                    disabled={startMutation.isPending}
                    onClick={() => void runTransition('start')}
                  >
                    <PlayCircle className="size-4" />
                    Start consultation
                  </Button>
                ) : null}
                {visit.status === 'IN_CONSULTATION' ? (
                  <Button
                    type="button"
                    disabled={completeMutation.isPending}
                    onClick={() => void runTransition('complete')}
                  >
                    <CheckCircle2 className="size-4" />
                    Complete Visit
                  </Button>
                ) : null}
                {active ? (
                  <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
                    <XCircle className="size-4" />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>

            <VisitStatusTimeline visit={visit} />

            {visit.status === 'CANCELLED' && visit.cancellationReason ? (
              <p className="text-muted-foreground text-sm">
                Cancellation reason: {visit.cancellationReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Visit details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field>
              <FieldLabel htmlFor="visit-chief-complaint">Chief complaint</FieldLabel>
              <Textarea
                id="visit-chief-complaint"
                rows={2}
                disabled={!active}
                value={chiefComplaint}
                onChange={(event) => setChiefComplaint(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
              <Textarea
                id="visit-remarks"
                rows={2}
                disabled={!active}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </Field>
            {active ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || updateMutation.isPending}
                  onClick={() => void handleSaveDetails()}
                >
                  <Save className="size-4" />
                  {updateMutation.isPending ? 'Saving…' : 'Save details'}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                This Visit is {status.label.toLowerCase()} and can no longer be edited.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-fluent-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Vitals this Visit</CardTitle>
              {active ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void setCaptureParam('vitals')}
                >
                  <Activity className="size-4" />
                  Record
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {visitVitals.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No vitals recorded during this Visit.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visitVitals.map((vitalSign) => (
                    <li key={vitalSign.id} className="rounded-md border p-2">
                      <p className="text-muted-foreground text-xs">
                        {new Date(vitalSign.recordedAt).toLocaleString()}
                      </p>
                      <p>
                        {[
                          vitalSign.systolic && vitalSign.diastolic
                            ? `BP ${vitalSign.systolic}/${vitalSign.diastolic}`
                            : null,
                          vitalSign.pulseBpm ? `Pulse ${vitalSign.pulseBpm}` : null,
                          vitalSign.temperatureC ? `Temp ${vitalSign.temperatureC}°C` : null,
                          vitalSign.spo2 ? `SpO₂ ${vitalSign.spo2}%` : null,
                          vitalSign.bmi ? `BMI ${vitalSign.bmi}` : null,
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
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Notes this Visit</CardTitle>
              {active ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void setCaptureParam('note')}
                >
                  <NotebookPen className="size-4" />
                  Add note
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {visitNotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No notes authored during this Visit.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visitNotes.map((note) => (
                    <li key={note.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{noteTypeName(note.noteTypeId)}</p>
                        <Badge variant={note.status === 'signed' ? 'outline' : 'secondary'}>
                          {note.status === 'signed' ? 'Signed' : 'Draft'}
                        </Badge>
                      </div>
                      {note.subjective ? (
                        <p className="text-muted-foreground line-clamp-2">{note.subjective}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RecordVitalsSheet
        open={captureParam === 'vitals'}
        patientId={visit.patient.id}
        visitId={visit.id}
        onClose={() => void setCaptureParam(null)}
      />

      <AddNoteSheet
        open={captureParam === 'note'}
        patientId={visit.patient.id}
        visitId={visit.id}
        onClose={() => void setCaptureParam(null)}
      />

      <CancelVisitDialog visit={cancelOpen ? visit : null} onClose={() => setCancelOpen(false)} />
    </>
  );
}
