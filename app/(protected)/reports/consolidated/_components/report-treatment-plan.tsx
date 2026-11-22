import type {
  ConsolidatedReportMedication,
  ConsolidatedReportTreatmentPlan,
} from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';

import { ReportSectionHeading, ReportTable } from './report-document-parts';

const PLAN_STATUS: Record<ConsolidatedReportTreatmentPlan['status'], string> = {
  PENDING: 'Pending',
  STOPPED: 'Stopped',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
};

function SubHeading({ children }: { children: string }) {
  return <h3 className="mb-1.5 text-[12.5px] font-semibold">{children}</h3>;
}

// A printed "nothing in this period" line, named so it is not mistaken for the shared Empty primitive.
function ReportEmptyLine({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground border-border border border-dashed px-3 py-3 text-center text-[12px]">
      {children}
    </p>
  );
}

/** The Patient Treatment Plans and medications that ran during the period. */
export function ReportTreatmentPlan({
  plans,
  medications,
}: {
  plans: ConsolidatedReportTreatmentPlan[];
  medications: ConsolidatedReportMedication[];
}) {
  return (
    <section className="space-y-4">
      <ReportSectionHeading title="Treatment plan" />

      <div className="break-inside-avoid">
        <SubHeading>Procedures</SubHeading>
        {plans.length > 0 ? (
          <ReportTable
            head={[
              { label: 'Treatment', className: 'w-[26%]' },
              { label: 'Procedure' },
              { label: 'Status', className: 'w-[13%]' },
              { label: 'In period', className: 'w-[10%] text-right tabular-nums' },
              { label: 'Sessions done', className: 'w-[12%] text-right tabular-nums' },
            ]}
            rows={plans.map((plan) => [
              plan.treatmentName,
              plan.procedures.join('; ') || '—',
              PLAN_STATUS[plan.status],
              plan.sessionsInPeriod,
              `${plan.completedSessions} of ${plan.totalSessions}`,
            ])}
          />
        ) : (
          <ReportEmptyLine>No Treatment Plan in this period.</ReportEmptyLine>
        )}
      </div>

      <div className="break-inside-avoid">
        <SubHeading>Medicines</SubHeading>
        {medications.length > 0 ? (
          <ReportTable
            head={[{ label: 'Medicine' }, { label: 'Dose' }, { label: 'Route' }, { label: 'Time' }]}
            rows={medications.map((medication) => [
              medication.drugName,
              medication.dose ?? '—',
              medication.route ?? '—',
              medication.frequency ?? '—',
            ])}
          />
        ) : (
          <ReportEmptyLine>No medicines in this period.</ReportEmptyLine>
        )}
      </div>
    </section>
  );
}
