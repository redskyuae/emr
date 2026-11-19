import type { ComponentType } from 'react';

import { DemoDataBanner } from '@/components/app/demo-data-banner';
import { DoctorVisitSummaryReportCard } from './doctor-visit-summary-report-card';
import { VisitRegisterReportCard } from './visit-register-report-card';

type ReportSection = {
  id: string;
  heading: string;
  description: string;
  reports: ComponentType[];
};

// New report groups are added here as further sections.
const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'outpatient-reports',
    heading: 'Outpatient reports',
    description: 'Each report will be produced as an Excel workbook and a PDF.',
    reports: [VisitRegisterReportCard, DoctorVisitSummaryReportCard],
  },
];

export function ReportsPageImpl() {
  return (
    <div className="space-y-6">
      <DemoDataBanner description="These reports are previews. Generate checks the period you choose but does not produce a file yet." />

      {REPORT_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="space-y-4">
          <div className="space-y-1">
            <h2 id={section.id} className="text-base font-semibold">
              {section.heading}
            </h2>
            <p className="text-muted-foreground text-sm">{section.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.reports.map((Report, index) => (
              <Report key={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
