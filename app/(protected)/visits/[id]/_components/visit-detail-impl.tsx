'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { CiCircleAlert } from 'react-icons/ci';
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
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { RichTextContent } from '@/components/clinical/rich-text-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CancelVisitDialog } from '../../_components/_modals/cancel-visit-dialog';
import { isActiveVisit } from '../../_utils/visit-status';
import { isCurrentPlan } from '../_utils/visit-treatment-plan';
import { visitOutstandingItems, visitOutstandingKinds } from '../_utils/visit-workflow';
import { AddPlanSessionsDialog } from './_modals/add-plan-sessions-dialog';
import { CompleteVisitDialog } from './_modals/complete-visit-dialog';
import { AmendVisitSheet } from './_sheets/amend-visit-sheet';
import { SignClinicalNoteDialog } from './_modals/sign-clinical-note-dialog';
import { AddNoteSheet } from './_sheets/add-note-sheet';
import { AssignTreatmentPlanSheet } from './_sheets/assign-treatment-plan-sheet';
import { DailyTreatmentSheet } from './_sheets/daily-treatment-sheet';
import { PlanSessionSheet } from './_sheets/plan-session-sheet';
import { RecordVitalsSheet } from './_sheets/record-vitals-sheet';
import { useCompleteVisitAnalytics } from './use-complete-visit-analytics';
import { VisitCarePathway } from './visit-care-pathway';
import { VisitContextPane } from './visit-context-pane';
import { VisitPatientHeader } from './visit-patient-header';

// Mirrors the destructive allergy Alert: icon and title, then the allergy line.
function AllergyBannerSkeleton() {
  return (
    <div
      className="grid gap-0.5 rounded-lg border px-2.5 py-2"
      aria-label="Loading Patient safety information"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="ml-6 h-4 w-72 max-w-[calc(100%-1.5rem)]" />
    </div>
  );
}

export function VisitDetailImpl({ visitId }: { visitId: number }) {
  const [captureParam, setCaptureParam] = useQueryState('capture');
  const [, setStepParam] = useQueryState('step');
  const [planSessionParam, setPlanSessionParam] = useQueryState('planSession', parseAsInteger);
  const [addSessionsParam, setAddSessionsParam] = useQueryState('addSessions', parseAsInteger);
  const [amendNoteParam, setAmendNoteParam] = useQueryState('amendNote', parseAsInteger);
  const [amendVitalParam, setAmendVitalParam] = useQueryState('amendVital', parseAsInteger);
  const { data: visit } = useVisit(visitId);
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const { data: canReadChart } = useHasPermission('patient-chart:read');
  const chartQuery = usePatientChartQuery(visit.patient.id, { enabled: canReadChart });
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
  const { data: canAssignPlan, isLoading: assignPermissionLoading } = useHasPermission(
    'patient-treatment-plan:assign'
  );
  const { data: canReadPlan, isLoading: readPermissionLoading } = useHasPermission(
    'patient-treatment-plan:read'
  );
  const { data: canBookAppointment } = useHasPermission('appointment:create');
  const { data: canViewAudit } = useHasPermission('audit-log:read');
  const { data: canViewDocuments } = useHasPermission('visit-document:read');
  const { data: canUpdatePlanSession } = useHasPermission('patient-treatment-plan:update');
  const { data: canStartPlanSession } = useHasPermission('patient-treatment-plan:start');
  const { data: canAmendVisit, isLoading: amendPermissionLoading } =
    useHasPermission('visit:amend');
  // Only a Completed Visit is amended; an active one is still edited in place.
  const canAmend = visit.status === 'COMPLETED' && Boolean(canAmendVisit);

  const chart = chartQuery.data;
  const safetyLoading = chartQuery.isLoading || allergensQuery.isLoading;
  const activeAllergyCount = (chart?.allergies ?? []).filter(
    (item) => item.status === 'active'
  ).length;
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
    consultationDirty,
  };
  const noteToAmend = canAmend ? visitNotes.find((note) => note.id === amendNoteParam) : undefined;
  const vitalToAmend = canAmend
    ? (chart?.vitalSigns ?? []).find(
        (reading) => reading.id === amendVitalParam && reading.visitId === visit.id
      )
    : undefined;
  // Clear-on-deny: once permission and the chart have loaded, an amend param that
  // cannot open a sheet (no permission, Visit not Completed, or an id outside this
  // Visit) is dropped so a stale link cannot open the sheet later.
  // Without `patient-chart:read` the chart never loads, so no target can resolve either.
  const amendTargetsResolved =
    !amendPermissionLoading && (!canAmend || !canReadChart || chartQuery.isSuccess);
  const staleAmendNote = amendNoteParam !== null && amendTargetsResolved && !noteToAmend;
  const staleAmendVital = amendVitalParam !== null && amendTargetsResolved && !vitalToAmend;

  useEffect(() => {
    if (staleAmendNote) {
      void setAmendNoteParam(null);
    }

    if (staleAmendVital) {
      void setAmendVitalParam(null);
    }
  }, [staleAmendNote, staleAmendVital, setAmendNoteParam, setAmendVitalParam]);

  // Sessions are added only to a current Plan, from an active Visit, by a user who may
  // assign Plans (the API requires both read and assign). A param that cannot open the
  // dialog is dropped once permissions and Plans have loaded successfully; a failed Plans
  // request leaves it in place so a network error cannot drop a valid link.
  const canAddPlanSessions = isActiveVisit(visit.status) && Boolean(canAssignPlan && canReadPlan);
  const addSessionsTarget = canAddPlanSessions
    ? (plansQuery.data ?? []).find((plan) => plan.id === addSessionsParam && isCurrentPlan(plan))
    : undefined;
  const addSessionsResolved =
    !assignPermissionLoading &&
    !readPermissionLoading &&
    (!canAddPlanSessions || plansQuery.isSuccess);
  const staleAddSessions = addSessionsParam !== null && addSessionsResolved && !addSessionsTarget;

  useEffect(() => {
    if (staleAddSessions) {
      void setAddSessionsParam(null);
    }
  }, [staleAddSessions, setAddSessionsParam]);

  const planSessionTarget = (plansQuery.data ?? [])
    .flatMap((plan) => plan.sessions.map((session) => ({ plan, session })))
    .find(({ session }) => session.id === planSessionParam);
  const outstanding = visitOutstandingItems(workflow);
  const completeOpen =
    captureParam === 'complete' && visit.status === 'IN_CONSULTATION' && !!canComplete;
  useCompleteVisitAnalytics({
    open: completeOpen,
    outstandingKinds: visitOutstandingKinds(workflow),
    visitStatus: visit.status,
  });

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
      {/* From xl the Visit is a cockpit that fits the screen: each pane scrolls on its own. */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 xl:h-[calc(100dvh-3.5rem)] xl:min-h-[30rem]">
        {/* The same safety banner the Patient Chart shows — the consulting
            Doctor must see allergies without leaving the Visit. */}
        <div className="flex-none space-y-3 empty:hidden">
          {!canReadChart ? (
            <Alert>
              <CiCircleAlert className="size-4" />
              <AlertTitle>Patient Chart not shown</AlertTitle>
              <AlertDescription>
                You do not have permission to view the Patient Chart, so allergies, Vital Signs and
                Clinical Notes are not shown on this Visit.
              </AlertDescription>
            </Alert>
          ) : chartQuery.isError ? (
            <Alert variant="destructive">
              <CiCircleAlert className="size-4" />
              <AlertTitle>Patient safety information unavailable</AlertTitle>
              <AlertDescription>Allergies and medications could not be loaded.</AlertDescription>
            </Alert>
          ) : safetyLoading || activeAllergyCount > 0 ? (
            // Most Patients have no allergies, so the slot is only kept while it loads or has a
            // banner to show; otherwise the skeleton simply leaves.
            <SkeletonCrossfade isLoading={safetyLoading} skeleton={<AllergyBannerSkeleton />}>
              <AllergyBanner allergies={chart?.allergies ?? []} allergenName={allergenName} />
            </SkeletonCrossfade>
          ) : null}
          {allergensQuery.isError && !chartQuery.isError ? (
            <Alert variant="destructive">
              <CiCircleAlert className="size-4" />
              <AlertTitle>Allergen names unavailable</AlertTitle>
              <AlertDescription>
                Review the Patient Chart before clinical decisions.
              </AlertDescription>
            </Alert>
          ) : null}
          {visit.status === 'CANCELLED' && visit.cancellationReason ? (
            <Alert>
              <AlertTitle>Visit cancelled</AlertTitle>
              <AlertDescription>
                <RichTextContent value={visit.cancellationReason} />
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <VisitPatientHeader
          visit={visit}
          allergyCount={
            chart ? chart.allergies.filter((item) => item.status === 'active').length : null
          }
          canStart={Boolean(canStart)}
          canComplete={Boolean(canComplete)}
          canCancel={Boolean(canCancel)}
          canCreateInvoice={Boolean(canCreateInvoice)}
          canRecordVitals={Boolean(canRecordVitals)}
          canCreateNote={Boolean(canCreateNote)}
          canAssignPlan={Boolean(canAssignPlan && canReadPlan)}
          canBookAppointment={Boolean(canBookAppointment)}
          canViewAudit={Boolean(canViewAudit)}
          canViewDocuments={Boolean(canViewDocuments)}
          canAmend={canAmend}
          starting={startMutation.isPending}
          onStart={() => void startConsultation()}
          onAmend={() => void setCaptureParam('amend')}
          onComplete={() => void setCaptureParam('complete')}
          onCancel={() => setCancelOpen(true)}
          onRecordVitals={() => void setCaptureParam('vitals')}
          onAddNote={() => void setCaptureParam('note')}
          onAddAllergy={() => void setCaptureParam('allergy')}
          onAddMedication={() => void setCaptureParam('medication')}
          onAssignPlan={() => void setCaptureParam('plan')}
          onOpenDocuments={() => {
            void setStepParam('review');
            requestAnimationFrame(() =>
              document.getElementById('visit-documents')?.scrollIntoView({ block: 'start' })
            );
          }}
        />

        <div className="grid gap-3 xl:min-h-0 xl:flex-1 xl:grid-cols-[19rem_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)] xl:gap-x-2">
          <div className="min-w-0 xl:order-2 xl:min-h-0">
            <VisitCarePathway
              visit={visit}
              chart={chart}
              chartLoading={chartQuery.isLoading}
              chartError={chartQuery.isError}
              invoices={invoices}
              invoicesLoading={invoicesQuery.isLoading}
              invoicesError={invoicesQuery.isError}
              canStart={Boolean(canStart)}
              canAmend={canAmend}
              starting={startMutation.isPending}
              onStart={() => void startConsultation()}
              onAmendVisit={() => void setCaptureParam('amend')}
              onAmendNote={(noteId) => void setAmendNoteParam(noteId)}
              onAmendVitalSign={(vitalId) => void setAmendVitalParam(vitalId)}
              onConsultationDirtyChange={setConsultationDirty}
              onRecordVitals={() => void setCaptureParam('vitals')}
              onAddNote={() => void setCaptureParam('nurse-note')}
              onDailyTreatment={() => void setCaptureParam('session')}
              onAssignPlan={() => void setCaptureParam('plan')}
              onAddPlanSessions={(planId) => void setAddSessionsParam(planId)}
              onOpenPlanSession={(sessionId) => void setPlanSessionParam(sessionId)}
              onAddClinicalNote={() => void setCaptureParam('note')}
              onSignNote={setNoteToSign}
            />
          </div>
          <VisitContextPane
            visit={visit}
            chart={chart}
            chartLoading={chartQuery.isLoading}
            chartError={chartQuery.isError}
            allergenName={allergenName}
            className="xl:order-1 xl:min-h-0 xl:p-0.5"
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

      {addSessionsTarget ? (
        <AddPlanSessionsDialog
          key={addSessionsTarget.id}
          patientId={visit.patient.id}
          plan={addSessionsTarget}
          onClose={() => void setAddSessionsParam(null)}
        />
      ) : null}

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

      <AmendVisitSheet
        open={captureParam === 'amend' && canAmend}
        visit={visit}
        onClose={() => void setCaptureParam(null)}
      />

      {noteToAmend ? (
        <AddNoteSheet
          key={`amend-note-${noteToAmend.id}`}
          open
          patientId={visit.patient.id}
          visitId={visit.id}
          note={noteToAmend}
          onClose={() => void setAmendNoteParam(null)}
        />
      ) : null}

      {vitalToAmend ? (
        <RecordVitalsSheet
          key={`amend-vital-${vitalToAmend.id}`}
          open
          patientId={visit.patient.id}
          visitId={visit.id}
          reading={vitalToAmend}
          onClose={() => void setAmendVitalParam(null)}
        />
      ) : null}

      <CompleteVisitDialog
        visit={visit}
        open={completeOpen}
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
