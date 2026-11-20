import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';

import { patientFullName } from '../../_utils/consolidated-report-format';
import { ReportSectionHeading } from './report-document-parts';
import { ReportLetterhead } from './report-letterhead';
import { ReportPatientDetails } from './report-patient-details';
import { ReportTreatmentPlan } from './report-treatment-plan';
import { ReportVisitProgress } from './report-visit-progress';

/** The printable Consolidated Patient Report for one Patient over one period. */
export function ConsolidatedReportDocument({ report }: { report: ConsolidatedPatientReport }) {
  const doctor = report.consultingDoctor;
  const credentials = [doctor?.qualifications, doctor?.specialtyName].filter(Boolean).join(' · ');

  return (
    <article
      data-consolidated-report
      aria-label={`Consolidated Patient Report for ${patientFullName(report.patient)}`}
      className="bg-card text-foreground border-border mx-auto w-full max-w-[210mm] space-y-7 rounded-lg border px-5 py-8 sm:px-12 sm:py-10 print:max-w-none print:rounded-none print:border-0 print:p-0"
    >
      <ReportLetterhead report={report} />
      <ReportPatientDetails report={report} />
      <ReportTreatmentPlan plans={report.treatmentPlans} medications={report.medications} />
      <ReportVisitProgress visits={report.visits} />

      {report.latestPlan ? (
        <section className="bg-primary/5 border-primary/20 break-inside-avoid rounded-lg border px-4 py-3.5">
          <ReportSectionHeading title="Advice" aside={`From ${report.latestPlan.visitNumber}`} />
          <p className="text-[12px] leading-relaxed whitespace-pre-line">
            {report.latestPlan.plan}
          </p>
        </section>
      ) : null}

      <footer className="flex break-inside-avoid flex-wrap items-end justify-between gap-6 pt-6">
        <p className="text-muted-foreground max-w-xs text-[10.5px] leading-relaxed">
          This report is generated from the EMR records for the period shown. Not valid for
          medico-legal purposes without signature and seal.
        </p>
        {doctor ? (
          <div className="border-foreground ml-auto min-w-48 border-t pt-1.5 text-center">
            <p className="text-[12px] font-semibold">{doctor.name}</p>
            {credentials ? (
              <p className="text-muted-foreground text-[11px]">{credentials}</p>
            ) : null}
          </div>
        ) : null}
      </footer>
    </article>
  );
}
