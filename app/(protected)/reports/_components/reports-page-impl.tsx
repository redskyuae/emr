import type { ComponentType } from 'react';

import { ConsolidatedReportCard } from './consolidated-report-card';

type ReportSection = {
  id: string;
  heading: string;
  description: string;
  reports: ComponentType[];
};

// New report groups are added here as further sections.
const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'patient-reports',
    heading: 'Patient reports',
    description:
      'Reports for one Patient from their recorded Visits, opened on their own page for printing.',
    reports: [ConsolidatedReportCard],
  },
];

export function ReportsPageImpl() {
  return (
    <div className="space-y-6">
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
