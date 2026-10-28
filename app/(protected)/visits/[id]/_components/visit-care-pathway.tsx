'use client';

import { useQueryState } from 'nuqs';

import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useInvoicesQuery } from '@/app/queries/billing/invoices/useInvoices';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { useVisitDocumentsQuery } from '@/app/queries/visits/useVisitDocuments';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { VisitBillingPanel } from './visit-billing-panel';
import { VisitClinicalPanel } from './visit-clinical-panel';
import { VisitDocumentsCard } from './visit-documents-card';
import { VisitTodayPanel } from './visit-today-panel';
import { VisitTreatmentPlansPanel } from './visit-treatment-plans-panel';

type Props = {
  visit: Visit;
  chart: PatientChart | undefined;
  chartLoading: boolean;
  chartError: boolean;
  onRecordVitals: () => void;
  onAddNote: () => void;
  onAddClinicalNote: () => void;
  onDoctorConsultation: () => void;
  onDailyTreatment: () => void;
  onAssignPlan: () => void;
};

const sections = ['today', 'clinical', 'plans', 'billing', 'docs'] as const;

export function VisitCarePathway({
  visit,
  chart,
  chartLoading,
  chartError,
  onRecordVitals,
  onAddNote,
  onAddClinicalNote,
  onDoctorConsultation,
  onDailyTreatment,
  onAssignPlan,
}: Props) {
  const [sectionParam, setSectionParam] = useQueryState('section');
  const section = sections.find((value) => value === sectionParam) ?? 'today';
  const plansQuery = usePatientTreatmentPlanHistoryQuery(visit.patient.id);
  const invoicesQuery = useInvoicesQuery({ patientId: visit.patient.id, page: 1, limit: 999 });
  const documentsQuery = useVisitDocumentsQuery(visit.id);
  const { data: canAssignPlan } = useHasPermission('patient-treatment-plan:assign');
  const { data: canReadPlan } = useHasPermission('patient-treatment-plan:read');
  const { data: canRecordVitals } = useHasPermission('vital-sign:create');
  const { data: canCreateNote } = useHasPermission('clinical-note:create');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canBookAppointment } = useHasPermission('appointment:create');

  const plans = plansQuery.data ?? [];
  const invoices = (invoicesQuery.data?.data ?? []).filter((item) => item.visit?.id === visit.id);
  const noteCount = (chart?.clinicalNotes ?? []).filter((item) => item.visitId === visit.id).length;
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';

  return (
    <Tabs
      value={section}
      onValueChange={(value) => void setSectionParam(value === 'today' ? null : value)}
      className="space-y-3"
    >
      <div className="overflow-x-auto border-b">
        <TabsList variant="line" aria-label="Visit sections" className="h-11 w-max gap-5 px-0">
          <TabsTrigger value="today" className="h-10 flex-none rounded-none px-1">
            Today&apos;s session
          </TabsTrigger>
          <TabsTrigger value="clinical" className="h-10 flex-none rounded-none px-1">
            Clinical{' '}
            {noteCount > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                {noteCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="plans" className="h-10 flex-none rounded-none px-1">
            Treatment plans{' '}
            {plans.length > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                {plans.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="billing" className="h-10 flex-none rounded-none px-1">
            Billing{' '}
            {invoices.length > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                {invoices.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="docs" className="h-10 flex-none rounded-none px-1">
            Documents{' '}
            {(documentsQuery.data?.length ?? 0) > 0 ? (
              <Badge variant="secondary" className="rounded-full">
                {documentsQuery.data?.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="today">
        <VisitTodayPanel
          visit={visit}
          chart={chart}
          chartLoading={chartLoading}
          chartError={chartError}
          invoiceCount={invoices.length}
          invoiceLoading={invoicesQuery.isLoading}
          invoiceError={invoicesQuery.isError}
          canRecordVitals={Boolean(canRecordVitals)}
          canCreateNote={Boolean(canCreateNote)}
          canCreateInvoice={Boolean(canCreateInvoice)}
          canBookAppointment={Boolean(canBookAppointment)}
          onRecordVitals={onRecordVitals}
          onDoctorConsultation={onDoctorConsultation}
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
          loading={invoicesQuery.isLoading}
          error={invoicesQuery.isError}
          canCreateInvoice={Boolean(canCreateInvoice)}
        />
      </TabsContent>
      <TabsContent value="docs">
        <VisitDocumentsCard visitId={visit.id} active={active} />
      </TabsContent>
    </Tabs>
  );
}
