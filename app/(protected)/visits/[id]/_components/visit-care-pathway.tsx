'use client';

import { useQueryState } from 'nuqs';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { InvoiceListItem } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { useVisitDocumentsQuery } from '@/app/queries/visits/useVisitDocuments';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { VisitBillingPanel } from './visit-billing-panel';
import { VisitClinicalPanel } from './visit-clinical-panel';
import { VisitConsultationPanel } from './visit-consultation-panel';
import { VisitDocumentsCard } from './visit-documents-card';
import { VisitTodayPanel } from './visit-today-panel';
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
  onAddAllergy: () => void;
  onAddMedication: () => void;
  onDailyTreatment: () => void;
  onAssignPlan: () => void;
  onSignNote: (note: ClinicalNote) => void;
};

const sections = ['consultation', 'details', 'clinical', 'plans', 'billing', 'docs'] as const;

function CountBadge({ count }: { count: number }) {
  return count > 0 ? (
    <Badge variant="secondary" className="rounded-full">
      {count}
    </Badge>
  ) : null;
}

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
  onAddAllergy,
  onAddMedication,
  onDailyTreatment,
  onAssignPlan,
  onSignNote,
}: Props) {
  const [sectionParam, setSectionParam] = useQueryState('section');
  // A Treatment Session Visit opens on the Session; every other Visit on the consultation.
  const defaultSection = visit.treatmentSession ? 'details' : 'consultation';
  const section = sections.find((value) => value === sectionParam) ?? defaultSection;
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const documentsQuery = useVisitDocumentsQuery(visit.id);
  const { data: canAssignPlan } = useHasPermission('patient-treatment-plan:assign');
  const { data: canReadPlan } = useHasPermission('patient-treatment-plan:read');
  const { data: canRecordVitals } = useHasPermission('vital-sign:create');
  const { data: canCreateNote } = useHasPermission('clinical-note:create');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canBookAppointment } = useHasPermission('appointment:create');

  const plans = plansQuery.data ?? [];
  const notes = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id);
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const triggerClass = 'h-10 flex-none rounded-none px-1';

  return (
    <Tabs
      value={section}
      onValueChange={(value) => void setSectionParam(value === defaultSection ? null : value)}
      className="min-w-0 space-y-3"
    >
      <div className="overflow-x-auto border-b">
        <TabsList variant="line" aria-label="Visit sections" className="h-11 w-max gap-5 px-0">
          <TabsTrigger value="consultation" className={triggerClass}>
            Consultation
          </TabsTrigger>
          <TabsTrigger value="details" className={triggerClass}>
            {visit.treatmentSession ? "Today's session" : 'Visit details'}
          </TabsTrigger>
          <TabsTrigger value="clinical" className={triggerClass}>
            Clinical records <CountBadge count={notes.length} />
          </TabsTrigger>
          <TabsTrigger value="plans" className={triggerClass}>
            Treatment plans <CountBadge count={plans.length} />
          </TabsTrigger>
          <TabsTrigger value="billing" className={triggerClass}>
            Billing <CountBadge count={invoices.length} />
          </TabsTrigger>
          <TabsTrigger value="docs" className={triggerClass}>
            Documents <CountBadge count={documentsQuery.data?.length ?? 0} />
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Stays mounted across tabs so an unsaved consultation is not lost. */}
      <TabsContent value="consultation" forceMount className="data-[state=inactive]:hidden">
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
        />
      </TabsContent>
      <TabsContent value="details">
        <VisitTodayPanel
          visit={visit}
          plans={plans}
          plansLoading={plansQuery.isLoading}
          plansError={plansQuery.isError}
          canReadPlans={Boolean(canReadPlan)}
          canCreateNote={Boolean(canCreateNote)}
          canBookAppointment={Boolean(canBookAppointment)}
          onDailyTreatment={onDailyTreatment}
        />
      </TabsContent>
      <TabsContent value="clinical">
        <VisitClinicalPanel
          visit={visit}
          chart={chart}
          chartLoading={chartLoading}
          chartError={chartError}
          canRecordVitals={Boolean(canRecordVitals)}
          canCreateNote={Boolean(canCreateNote)}
          onRecordVitals={onRecordVitals}
          onAddClinicalNote={onAddClinicalNote}
          onNursingHandoff={onAddNote}
          onAddAllergy={onAddAllergy}
          onAddMedication={onAddMedication}
          onSignNote={onSignNote}
        />
      </TabsContent>
      <TabsContent value="plans">
        <VisitTreatmentPlansPanel
          visit={visit}
          plans={plans}
          loading={plansQuery.isLoading}
          error={plansQuery.isError}
          canAssignPlan={Boolean(canAssignPlan && canReadPlan)}
          canBookAppointment={Boolean(canBookAppointment)}
          onAssignPlan={onAssignPlan}
        />
      </TabsContent>
      <TabsContent value="billing">
        <VisitBillingPanel
          visit={visit}
          invoices={invoices}
          loading={invoicesLoading}
          error={invoicesError}
          canCreateInvoice={Boolean(canCreateInvoice)}
        />
      </TabsContent>
      <TabsContent value="docs">
        <VisitDocumentsCard visitId={visit.id} active={active} />
      </TabsContent>
    </Tabs>
  );
}
