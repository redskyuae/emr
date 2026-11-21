'use client';

import type { ReactNode } from 'react';
import { PiPrinterLight } from 'react-icons/pi';

import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';
import { Button } from '@/components/ui/button';

import { displayDate, patientFullName } from '../../_utils/consolidated-report-format';

/** Back to Reports, which report is showing, and Print (which also saves as PDF). */
export function ReportToolbar({
  back,
  report,
  onPrint,
}: {
  back: ReactNode;
  report: ConsolidatedPatientReport;
  onPrint: () => void;
}) {
  const visitCount = report.visits.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        {back}
        <p className="text-muted-foreground text-sm">
          Report for{' '}
          <span className="text-foreground font-semibold">{patientFullName(report.patient)}</span> ·{' '}
          {displayDate(report.period.fromDate)} to {displayDate(report.period.toDate)} ·{' '}
          {visitCount} {visitCount === 1 ? 'Visit' : 'Visits'}
        </p>
      </div>
      <Button type="button" onClick={onPrint}>
        <PiPrinterLight className="size-4" />
        Print or save as PDF
      </Button>
    </div>
  );
}
