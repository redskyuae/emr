'use client';

import { useState } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { AllergyBanner } from '@/app/(protected)/patients/[id]/_components/_chart/allergy-banner';
import { AllergyFormSheet } from '@/app/(protected)/patients/[id]/_components/_chart/_sheets/allergy-form-sheet';
import { MedicationFormSheet } from '@/app/(protected)/patients/[id]/_components/_chart/_sheets/medication-form-sheet';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useInvoicesQuery } from '@/app/queries/billing/invoices/useInvoices';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { usePatientChartQuery } from '@/app/queries/patients/chart/usePatientChart';
import { useStartConsultation } from '@/app/queries/visits/useStartConsultation';
import { useVisit } from '@/app/queries/visits/useVisit';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CancelVisitDialog } from '../../_components/_modals/cancel-visit-dialog';
import {
  visitOutstandingItems,
  visitWorkflowSteps,
  type VisitWorkflowStepKey,
} from '../_utils/visit-workflow';
import { CompleteVisitDialog } from './_modals/complete-visit-dialog';
import { SignClinicalNoteDialog } from './_modals/sign-clinical-note-dialog';
import { AddNoteSheet } from './_sheets/add-note-sheet';
import { AssignTreatmentPlanSheet } from './_sheets/assign-treatment-plan-sheet';
import { DailyTreatmentSheet } from './_sheets/daily-treatment-sheet';
import { PlanSessionSheet } from './_sheets/plan-session-sheet';
import { RecordVitalsSheet } from './_sheets/record-vitals-sheet';
import { VisitCarePathway } from './visit-care-pathway';
import { VisitPatientHeader } from './visit-patient-header';
import { VisitSnapshotRail } from './visit-snapshot-rail';
import { VisitWorkflowStepper } from './visit-workflow-stepper';

// Each workflow step opens the place where that step's work is done.
const STEP_SECTIONS: Record<VisitWorkflowStepKey, string> = {
  vitals: 'clinical',
  signed: 'clinical',
  invoice: 'billing',
  completed: 'details',
  cancelled: 'details',
  'checked-in': 'details',
  consultation: 'consultation',
};

export function VisitDetailImpl({ visitId }: { visitId: number }) {
  const [captureParam, setCaptureParam] = useQueryState('capture');
  const [, setSectionParam] = useQueryState('section');
  const [planSessionParam, setPlanSessionParam] = useQueryState('planSession', parseAsInteger);
  const { data: visit } = useVisit(visitId);
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const chartQuery = usePatientChartQuery(visit.patient.id);
  const allergensQuery = useAllergensQuery({ limit: 100 });
  const invoicesQuery = useInvoicesQuery({ patientId: visit.patient.id, page: 1, limit: 999 });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [noteToSign, setNoteToSign] = useState<ClinicalNote | null>(null);
  const [consultationDirty, setConsultationDirty] = useState(false);

  const startMutation = useStartConsultation();

  const { data: canStart } = useHasPermission('visit:start');
  const { data: canComplete } = useHasPermission('visit:complete');
  const { data: canCancel } = useHasPermission('visit:cancel');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canRecordVitals } = useHasPermission('vital-sign:create');
  const { data: canCreateNote } = useHasPermission('clinical-note:create');
  const { data: canAssignPlan } = useHasPermission('patient-treatment-plan:assign');
  const { data: canReadPlan } = useHasPermission('patient-treatment-plan:read');
  const { data: canBookAppointment } = useHasPermission('appointment:create');
  const { data: canUpdatePlanSession } = useHasPermission('patient-treatment-plan:update');
  const { data: canStartPlanSession } = useHasPermission('patient-treatment-plan:start');

  const chart = chartQuery.data;
  const allergenName = (id: number) =>
    allergensQuery.data?.data.find((allergen) => allergen.id === id)?.name ?? 'Allergen';
  const invoices = (invoicesQuery.data?.data ?? []).filter((item) => item.visit?.id === visit.id);
  const visitNotes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const workflow = {
    status: visit.status,
    vitalsCount: (chart?.vitalSigns ?? []).filter((item) => item.visitId === visit.id).length,
    noteCount: visitNotes.length,
    draftNoteCount: visitNotes.filter((note) => note.status === 'draft').length,
    invoiceCount: invoices.length,
  };
  const planSessionTarget = (plansQuery.data ?? [])
    .flatMap((plan) => plan.sessions.map((session) => ({ plan, session })))
    .find(({ session }) => session.id === planSessionParam);
  const outstanding = [
    ...(consultationDirty ? ['The consultation has unsaved changes.'] : []),
    ...visitOutstandingItems(workflow),
  ];

  async function startConsultation() {
    try {
      await startMutation.mutateAsync(visit.id);
      toast.success(`${visit.visitNumber} is now in consultation.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-screen-2xl space-y-4">
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
          <AllergyBanner allergies={chart?.allergies ?? []} allergenName={allergenName} />
        )}
        {allergensQuery.isError && !chartQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Allergen names unavailable</AlertTitle>
            <AlertDescription>Review the Patient Chart before clinical decisions.</AlertDescription>
          </Alert>
        ) : null}

        <VisitPatientHeader
          visit={visit}
          allergyCount={
            chart ? chart.allergies.filter((item) => item.status === 'active').length : null
          }
          canStart={Boolean(canStart)}
          canComplete={Boolean(canComplete)}
          canCancel={Boolean(canCancel)}
          canCreateInvoice={Boolean(canCreateInvoice)}
          starting={startMutation.isPending}
          onStart={() => void startConsultation()}
          onComplete={() => void setCaptureParam('complete')}
          onCancel={() => setCancelOpen(true)}
        />

        <Card className="shadow-fluent-2 py-3">
          <CardContent className="space-y-3 px-4">
            <VisitWorkflowStepper
              visit={visit}
              steps={visitWorkflowSteps(workflow)}
              onStepSelect={(key) => void setSectionParam(STEP_SECTIONS[key])}
            />
            {visit.status === 'CANCELLED' && visit.cancellationReason ? (
              <div className="text-muted-foreground border-t pt-3 text-sm">
                <span className="font-medium">Cancellation reason:</span>
                <RichTextContent value={visit.cancellationReason} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <VisitCarePathway
            visit={visit}
            chart={chart}
            chartLoading={chartQuery.isLoading}
            chartError={chartQuery.isError}
            invoices={invoices}
            invoicesLoading={invoicesQuery.isLoading}
            invoicesError={invoicesQuery.isError}
            canStart={Boolean(canStart)}
            starting={startMutation.isPending}
            onStart={() => void startConsultation()}
            onConsultationDirtyChange={setConsultationDirty}
            onRecordVitals={() => void setCaptureParam('vitals')}
            onAddNote={() => void setCaptureParam('nurse-note')}
            onDailyTreatment={() => void setCaptureParam('session')}
            onAssignPlan={() => void setCaptureParam('plan')}
            onOpenPlanSession={(sessionId) => void setPlanSessionParam(sessionId)}
            onAddClinicalNote={() => void setCaptureParam('note')}
            onAddAllergy={() => void setCaptureParam('allergy')}
            onAddMedication={() => void setCaptureParam('medication')}
            onSignNote={setNoteToSign}
          />
          <VisitSnapshotRail
            visit={visit}
            chart={chart}
            chartLoading={chartQuery.isLoading}
            chartError={chartQuery.isError}
            allergenName={allergenName}
            invoiceCount={invoices.length}
            invoiceLoading={invoicesQuery.isLoading}
            invoiceError={invoicesQuery.isError}
            canRecordVitals={Boolean(canRecordVitals)}
            canCreateNote={Boolean(canCreateNote)}
            canAssignPlan={Boolean(canAssignPlan && canReadPlan)}
            canCreateInvoice={Boolean(canCreateInvoice)}
            canBookAppointment={Boolean(canBookAppointment)}
            onRecordVitals={() => void setCaptureParam('vitals')}
            onAddNote={() => void setCaptureParam('note')}
            onAddAllergy={() => void setCaptureParam('allergy')}
            onAddMedication={() => void setCaptureParam('medication')}
            onAssignPlan={() => void setCaptureParam('plan')}
            onOpenDocuments={() => void setSectionParam('docs')}
          />
        </div>
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

      <AllergyFormSheet
        open={captureParam === 'allergy'}
        mode="new"
        patientId={visit.patient.id}
        allergy={null}
        onClose={() => void setCaptureParam(null)}
      />

      <MedicationFormSheet
        open={captureParam === 'medication'}
        mode="new"
        patientId={visit.patient.id}
        medication={null}
        onClose={() => void setCaptureParam(null)}
      />

      <AssignTreatmentPlanSheet
        key={captureParam === 'plan' ? 'plan-open' : 'plan-closed'}
        open={captureParam === 'plan'}
        patientId={visit.patient.id}
        onClose={() => void setCaptureParam(null)}
      />

      {planSessionTarget ? (
        <PlanSessionSheet
          key={planSessionTarget.session.id}
          open
          visit={visit}
          plan={planSessionTarget.plan}
          session={planSessionTarget.session}
          canUpdate={Boolean(canUpdatePlanSession && canReadPlan)}
          canStart={Boolean(canStartPlanSession && canReadPlan)}
          onClose={() => void setPlanSessionParam(null)}
        />
      ) : null}

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

      <CompleteVisitDialog
        visit={visit}
        open={captureParam === 'complete' && visit.status === 'IN_CONSULTATION' && !!canComplete}
        outstanding={outstanding}
        onClose={() => void setCaptureParam(null)}
      />

      <SignClinicalNoteDialog
        patientId={visit.patient.id}
        note={noteToSign}
        onClose={() => setNoteToSign(null)}
      />

      <CancelVisitDialog visit={cancelOpen ? visit : null} onClose={() => setCancelOpen(false)} />
    </>
  );
}
