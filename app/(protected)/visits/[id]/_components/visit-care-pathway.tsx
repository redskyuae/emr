'use client';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { useVisitDocumentsQuery } from '@/app/queries/visits/useVisitDocuments';

import { VisitBillingPanel } from './visit-billing-panel';
import { VisitClinicalNotesCard } from './visit-clinical-notes-card';
import { VisitConsultationPanel } from './visit-consultation-panel';
import { VisitDetailsDisclosure } from './visit-details-disclosure';
import { VisitDocumentsCard } from './visit-documents-card';
import { VisitObjectiveVitals } from './visit-objective-vitals';
import { VisitPlanSession } from './visit-plan-session';
import { VisitReviewChecklist } from './visit-review-checklist';
import { VisitTreatmentPlansPanel } from './visit-treatment-plans-panel';

type Props = {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  invoices: InvoiceListItem[];
  invoicesLoading: boolean;
  invoicesError: boolean;
  canStart: boolean;
  starting: boolean;
  onStart: () => void;
  onConsultationDirtyChange: (dirty: boolean) => void;
  onRecordVitals: () => void;
  onAddNote: () => void;
  onAddClinicalNote: () => void;
  onDailyTreatment: () => void;
  onAssignPlan: () => void;
  onOpenPlanSession: (sessionId: number) => void;
  onSignNote: (note: ClinicalNote) => void;
};

/**
 * The whole Visit as one stepped pathway: each step carries the records that belong to it,
 * so Visit details, Vital Signs, Treatment Plans, Clinical Notes, Billing and Documents
 * sit beside the part of the consultation where the Doctor needs them.
 */
export function VisitCarePathway({
  visit,
  chart,
  chartLoading,
  chartError,
  invoices,
  invoicesLoading,
  invoicesError,
  canStart,
  starting,
  onStart,
  onConsultationDirtyChange,
  onRecordVitals,
  onAddNote,
  onAddClinicalNote,
  onDailyTreatment,
  onAssignPlan,
  onOpenPlanSession,
  onSignNote,
}: Props) {
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const documentsQuery = useVisitDocumentsQuery(visit.id);
  const { data: canAssignPlan } = useHasPermission('patient-treatment-plan:assign');
  const { data: canReadPlan } = useHasPermission('patient-treatment-plan:read');
  const { data: canStartPlanSession } = useHasPermission('patient-treatment-plan:start');
  const { data: canRecordVitals } = useHasPermission('vital-sign:create');
  const { data: canCreateNote } = useHasPermission('clinical-note:create');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canBookAppointment } = useHasPermission('appointment:create');

  const plans = plansQuery.data ?? [];
  const notes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const vitals = chart?.vitalSigns ?? [];
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const canRecordResponse = active && Boolean(canCreateNote);

  const slots = {
    subjective: <VisitDetailsDisclosure visit={visit} />,
    objective: (
      <VisitObjectiveVitals
        visitId={visit.id}
        readings={vitals}
        loading={chartLoading}
        error={chartError}
        canRecord={active && Boolean(canRecordVitals)}
        onRecord={onRecordVitals}
      />
    ),
    plan: (
      <div className="space-y-4">
        <VisitPlanSession
          visit={visit}
          canRecordResponse={canRecordResponse}
          onDailyTreatment={onDailyTreatment}
        />
        {canReadPlan ? (
          <VisitTreatmentPlansPanel
            visit={visit}
            plans={plans}
            loading={plansQuery.isLoading}
            error={plansQuery.isError}
            canAssignPlan={Boolean(canAssignPlan && canReadPlan)}
            canBookAppointment={Boolean(canBookAppointment)}
            canStartSession={Boolean(canStartPlanSession && canReadPlan)}
            onAssignPlan={onAssignPlan}
            onOpenSession={onOpenPlanSession}
          />
        ) : null}
      </div>
    ),
    review: (
      <div className="space-y-4">
        <VisitReviewChecklist
          visit={visit}
          vitalsCount={vitals.filter((item) => item.visitId === visit.id).length}
          noteCount={notes.length}
          signedNoteCount={notes.filter((note) => note.status === 'signed').length}
          invoiceCount={invoices.length}
          documentCount={documentsQuery.data?.length ?? 0}
          chartLoading={chartLoading}
          invoicesLoading={invoicesLoading}
          invoicesError={invoicesError}
          documentsLoading={documentsQuery.isLoading}
          canRecordVitals={active && Boolean(canRecordVitals)}
          canRecordResponse={canRecordResponse}
          onRecordVitals={onRecordVitals}
          onDailyTreatment={onDailyTreatment}
        />
        <VisitClinicalNotesCard
          notes={notes}
          loading={chartLoading}
          error={chartError}
          active={active}
          canCreateNote={Boolean(canCreateNote)}
          onAddClinicalNote={onAddClinicalNote}
          onNursingHandoff={onAddNote}
          onSignNote={onSignNote}
        />
        <VisitBillingPanel
          visit={visit}
          invoices={invoices}
          loading={invoicesLoading}
          error={invoicesError}
          canCreateInvoice={Boolean(canCreateInvoice)}
        />
        <div id="visit-documents" className="scroll-mt-4">
          <VisitDocumentsCard visitId={visit.id} active={active} />
        </div>
      </div>
    ),
  };

  return (
    <div className="min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:p-0.5">
      <VisitConsultationPanel
        visit={visit}
        notes={notes}
        chartLoading={chartLoading}
        chartError={chartError}
        canCreateNote={Boolean(canCreateNote)}
        canStart={canStart}
        starting={starting}
        onStart={onStart}
        onAddNote={onAddClinicalNote}
        onDirtyChange={onConsultationDirtyChange}
        slots={slots}
      />
    </div>
  );
}
