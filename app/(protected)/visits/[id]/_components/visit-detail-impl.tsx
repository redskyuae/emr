'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, PlayCircle, ReceiptText, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { AllergyBanner } from '@/app/(protected)/patients/[id]/_components/_chart/allergy-banner';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { usePatientChartQuery } from '@/app/queries/patients/chart/usePatientChart';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { useStartConsultation } from '@/app/queries/visits/useStartConsultation';
import { useVisit } from '@/app/queries/visits/useVisit';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CancelVisitDialog } from '../../_components/_modals/cancel-visit-dialog';
import { isActiveVisit, visitStatusPresentation } from '../../_utils/visit-status';
import { AddNoteSheet } from './_sheets/add-note-sheet';
import { AssignTreatmentPlanSheet } from './_sheets/assign-treatment-plan-sheet';
import { DoctorConsultationSheet } from './_sheets/doctor-consultation-sheet';
import { DailyTreatmentSheet } from './_sheets/daily-treatment-sheet';
import { RecordVitalsSheet } from './_sheets/record-vitals-sheet';
import { VisitCarePathway } from './visit-care-pathway';
import { VisitStatusTimeline } from './visit-status-timeline';

export function VisitDetailImpl({ visitId }: { visitId: number }) {
  const [captureParam, setCaptureParam] = useQueryState('capture');
  const { data: visit } = useVisit(visitId);
  const chartQuery = usePatientChartQuery(visit.patient.id);
  const allergensQuery = useAllergensQuery({ limit: 100 });
  const [cancelOpen, setCancelOpen] = useState(false);

  const startMutation = useStartConsultation();
  const completeMutation = useCompleteVisit();

  const { data: canStart } = useHasPermission('visit:start');
  const { data: canComplete } = useHasPermission('visit:complete');
  const { data: canCancel } = useHasPermission('visit:cancel');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');

  const status = visitStatusPresentation(visit.status);
  const active = isActiveVisit(visit.status);
  const allergenName = (id: number) =>
    allergensQuery.data?.data.find((allergen) => allergen.id === id)?.name ?? 'Allergen';

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

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* The same safety banner the Patient Chart shows — the consulting
            Doctor must see allergies without leaving the Visit. */}
        {chartQuery.isLoading || allergensQuery.isLoading ? (
          <Skeleton className="h-14 w-full" aria-label="Loading Patient safety information" />
        ) : chartQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Patient safety information unavailable</AlertTitle>
            <AlertDescription>Allergies and medications could not be loaded.</AlertDescription>
          </Alert>
        ) : (
          <AllergyBanner allergies={chartQuery.data?.allergies ?? []} allergenName={allergenName} />
        )}
        {allergensQuery.isError && !chartQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Allergen names unavailable</AlertTitle>
            <AlertDescription>Review the Patient Chart before clinical decisions.</AlertDescription>
          </Alert>
        ) : null}

        <Card className="shadow-fluent-2">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-xl text-base font-semibold"
                  aria-hidden="true"
                >
                  {visit.patient.firstName.charAt(0)}
                  {visit.patient.lastName.charAt(0)}
                </span>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/patients/${visit.patient.id}`}
                      className="text-xl font-semibold hover:underline"
                    >
                      {visit.patient.firstName} {visit.patient.lastName}
                    </Link>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {visit.patient.mrn} · {visit.visitType.name} · {visit.doctor.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {visit.visitDate} · {visit.visitNumber} ·{' '}
                    {visit.appointment?.bookingNumber ?? 'Walk-in'}
                    <span className="text-primary ml-2 font-medium">Token {visit.queueToken}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {active && canCancel ? (
                  <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
                    <XCircle className="size-4" />
                    Cancel Visit
                  </Button>
                ) : null}
                {canCreateInvoice ? (
                  <Button asChild variant="outline">
                    <Link
                      href={`/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`}
                    >
                      <ReceiptText className="size-4" />
                      Create Invoice
                    </Link>
                  </Button>
                ) : null}
                {visit.status === 'CHECKED_IN' && canStart ? (
                  <Button
                    type="button"
                    disabled={startMutation.isPending}
                    aria-busy={startMutation.isPending}
                    onClick={() => void runTransition('start')}
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PlayCircle className="size-4" />
                    )}
                    {startMutation.isPending ? 'Starting consultation…' : 'Start consultation'}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="border-t pt-5">
              <VisitStatusTimeline visit={visit} />
            </div>

            {visit.status === 'CANCELLED' && visit.cancellationReason ? (
              <p className="text-muted-foreground text-sm">
                Cancellation reason: {visit.cancellationReason}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <VisitCarePathway
          visit={visit}
          chart={chartQuery.data}
          chartLoading={chartQuery.isLoading}
          chartError={chartQuery.isError}
          onRecordVitals={() => void setCaptureParam('vitals')}
          onAddNote={() => void setCaptureParam('nurse-note')}
          onDoctorConsultation={() => void setCaptureParam('consultation')}
          onDailyTreatment={() => void setCaptureParam('session')}
          onAssignPlan={() => void setCaptureParam('plan')}
          onAddClinicalNote={() => void setCaptureParam('note')}
        />

        {visit.status === 'IN_CONSULTATION' && canComplete ? (
          <div className="flex justify-end border-t pt-5">
            <Button
              type="button"
              disabled={completeMutation.isPending}
              onClick={() => void runTransition('complete')}
            >
              <CheckCircle2 className="size-4" />
              {completeMutation.isPending ? 'Completing Visit…' : 'Complete Visit'}
            </Button>
          </div>
        ) : null}
      </div>

      <RecordVitalsSheet
        open={captureParam === 'vitals'}
        patientId={visit.patient.id}
        visitId={visit.id}
        onClose={() => void setCaptureParam(null)}
      />

      <AddNoteSheet
        open={captureParam === 'note' || captureParam === 'nurse-note'}
        patientId={visit.patient.id}
        visitId={visit.id}
        preferredNoteTypeCode={captureParam === 'nurse-note' ? 'NURS' : undefined}
        onClose={() => void setCaptureParam(null)}
      />

      <AssignTreatmentPlanSheet
        key={captureParam === 'plan' ? 'plan-open' : 'plan-closed'}
        open={captureParam === 'plan'}
        patientId={visit.patient.id}
        onClose={() => void setCaptureParam(null)}
      />

      <DoctorConsultationSheet
        open={captureParam === 'consultation'}
        patientId={visit.patient.id}
        visitId={visit.id}
        chiefComplaint={visit.chiefComplaint}
        onClose={() => void setCaptureParam(null)}
      />

      {visit.treatmentSession ? (
        <DailyTreatmentSheet
          open={captureParam === 'session'}
          patientId={visit.patient.id}
          visitId={visit.id}
          appointmentId={visit.appointment?.id ?? null}
          session={visit.treatmentSession}
          onClose={() => void setCaptureParam(null)}
        />
      ) : null}

      <CancelVisitDialog visit={cancelOpen ? visit : null} onClose={() => setCancelOpen(false)} />
    </>
  );
}
