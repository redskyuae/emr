'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import {
  Activity,
  ArrowRightLeft,
  BedDouble,
  LogOut,
  NotebookPen,
  Save,
  User,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { AllergyBanner } from '@/app/(protected)/patients/[id]/_components/_chart/allergy-banner';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAdmission } from '@/app/queries/admissions/useAdmission';
import { useUpdateAdmission } from '@/app/queries/admissions/useUpdateAdmission';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { usePatientChartQuery } from '@/app/queries/patients/chart/usePatientChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CancelAdmissionDialog } from '../../_components/_modals/cancel-admission-dialog';
import { DischargeDialog } from '../../_components/_modals/discharge-dialog';
import { TransferBedDialog } from '../../_components/_modals/transfer-bed-dialog';
import {
  admissionStatusPresentation,
  dischargeDispositionLabel,
  toDateInputValue,
  toDisplayDate,
} from '../../_utils/admission-status';
import { AddNoteSheet } from './_sheets/add-note-sheet';
import { RecordVitalsSheet } from './_sheets/record-vitals-sheet';
import { AdmissionStatusTimeline } from './admission-status-timeline';

export function AdmissionDetailImpl({ admissionId }: { admissionId: number }) {
  const [captureParam, setCaptureParam] = useQueryState('capture');
  const { data: admission } = useAdmission(admissionId);
  const chartQuery = usePatientChartQuery(admission.patient.id);
  const allergensQuery = useAllergensQuery({ limit: 100 });
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const [transferOpen, setTransferOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [admissionReason, setAdmissionReason] = useState(admission.admissionReason ?? '');
  const [remarks, setRemarks] = useState(admission.remarks ?? '');
  const [expectedDischarge, setExpectedDischarge] = useState(
    admission.expectedDischargeDate ? toDateInputValue(admission.expectedDischargeDate) : ''
  );

  const updateMutation = useUpdateAdmission();

  const status = admissionStatusPresentation(admission.status);
  const active = admission.status === 'ADMITTED';

  const allergenName = (id: number) =>
    allergensQuery.data?.data.find((allergen) => allergen.id === id)?.name ?? 'Allergen';
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((noteType) => noteType.id === id)?.name ?? 'Note';

  const admissionVitals = (chartQuery.data?.vitalSigns ?? []).filter(
    (vitalSign) => vitalSign.admissionId === admission.id
  );
  const admissionNotes = (chartQuery.data?.clinicalNotes ?? []).filter(
    (note) => note.admissionId === admission.id
  );

  const isDirty =
    admissionReason !== (admission.admissionReason ?? '') ||
    remarks !== (admission.remarks ?? '') ||
    expectedDischarge !==
      (admission.expectedDischargeDate ? toDateInputValue(admission.expectedDischargeDate) : '');

  async function handleSaveDetails() {
    try {
      await updateMutation.mutateAsync({
        id: admission.id,
        request: {
          admissionReason: admissionReason || undefined,
          remarks: remarks || undefined,
          expectedDischargeDate: expectedDischarge ? toDisplayDate(expectedDischarge) : undefined,
        },
      });
      toast.success('Admission updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* The same safety banner the Patient Chart shows — ward staff must see
            allergies without leaving the Admission. */}
        <AllergyBanner allergies={chartQuery.data?.allergies ?? []} allergenName={allergenName} />

        <Card className="shadow-fluent-2">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{admission.admissionNumber}</h2>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <BedDouble className="size-4" />
                  {admission.ward.name} · {admission.bed.bedNumber} · {admission.admissionType.name}{' '}
                  · {admission.doctor.name}
                  {admission.visit ? ` · from ${admission.visit.visitNumber}` : ''}
                </p>
                <Link
                  href={`/patients/${admission.patient.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  <User className="size-4" />
                  {admission.patient.firstName} {admission.patient.lastName} ·{' '}
                  {admission.patient.mrn}
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {active ? (
                  <>
                    <Button type="button" onClick={() => setDischargeOpen(true)}>
                      <LogOut className="size-4" />
                      Discharge
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setTransferOpen(true)}>
                      <ArrowRightLeft className="size-4" />
                      Transfer Bed
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
                      <XCircle className="size-4" />
                      Cancel
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <AdmissionStatusTimeline admission={admission} />

            {admission.status === 'DISCHARGED' && admission.dischargeDisposition ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Disposition:</span>{' '}
                  {dischargeDispositionLabel(admission.dischargeDisposition)}
                </p>
                {admission.dischargeSummary ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {admission.dischargeSummary}
                  </p>
                ) : null}
              </div>
            ) : null}

            {admission.status === 'CANCELLED' && admission.cancellationReason ? (
              <p className="text-muted-foreground text-sm">
                Cancellation reason: {admission.cancellationReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle className="text-base">Admission details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field>
                <FieldLabel htmlFor="admission-reason">Admission reason</FieldLabel>
                <Textarea
                  id="admission-reason"
                  rows={2}
                  disabled={!active}
                  value={admissionReason}
                  onChange={(event) => setAdmissionReason(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admission-remarks">Remarks</FieldLabel>
                <Textarea
                  id="admission-remarks"
                  rows={2}
                  disabled={!active}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admission-edd">Expected discharge date</FieldLabel>
                <Input
                  id="admission-edd"
                  type="date"
                  disabled={!active}
                  value={expectedDischarge}
                  onChange={(event) => setExpectedDischarge(event.target.value)}
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
                  This Admission is {status.label.toLowerCase()} and can no longer be edited.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle className="text-base">Bed history</CardTitle>
            </CardHeader>
            <CardContent>
              {admission.transfers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No transfers — the Patient has been in {admission.bed.bedNumber} since admission.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {admission.transfers.map((transfer) => (
                    <li key={transfer.id} className="rounded-md border p-2">
                      <p className="font-medium">
                        {transfer.fromBed.bedNumber} → {transfer.toBed.bedNumber}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(transfer.transferredAt).toLocaleString()}
                        {transfer.reason ? ` · ${transfer.reason}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-fluent-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Vitals this Admission</CardTitle>
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
              {admissionVitals.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No vitals recorded during this Admission.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {admissionVitals.map((vitalSign) => (
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
              <CardTitle className="text-base">Notes this Admission</CardTitle>
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
              {admissionNotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No notes authored during this Admission.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {admissionNotes.map((note) => (
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
        patientId={admission.patient.id}
        admissionId={admission.id}
        onClose={() => void setCaptureParam(null)}
      />

      <AddNoteSheet
        open={captureParam === 'note'}
        patientId={admission.patient.id}
        admissionId={admission.id}
        onClose={() => void setCaptureParam(null)}
      />

      <TransferBedDialog
        admission={transferOpen ? admission : null}
        onClose={() => setTransferOpen(false)}
      />

      <DischargeDialog
        admission={dischargeOpen ? admission : null}
        onClose={() => setDischargeOpen(false)}
      />

      <CancelAdmissionDialog
        admission={cancelOpen ? admission : null}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}
