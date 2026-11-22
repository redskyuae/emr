'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PiArrowLeftLight, PiFileMagnifyingGlassDuotone } from 'react-icons/pi';

import { useConsolidatedPatientReportQuery } from '@/app/queries/patients/useConsolidatedPatientReport';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';

import { isValidPeriod, periodDays, toApiDate } from '../../_utils/consolidated-report-period';
import { ConsolidatedReportDocument } from './consolidated-report-document';
import { useConsolidatedReportCriteria } from './consolidated-report-criteria';
import { ReportDocumentSkeleton } from './report-document-skeleton';
import { ReportToolbar } from './report-toolbar';

function printReport() {
  captureAnalyticsEvent('document_printed', { document: 'consolidated_report' });
  window.print();
}

function BackToReports() {
  return (
    <Button asChild variant="outline">
      <Link href="/reports">
        <PiArrowLeftLight className="size-4" />
        Back to Reports
      </Link>
    </Button>
  );
}

/** The report for the Patient and period in the URL, generated from the Reports page. */
export function ConsolidatedReportPageImpl() {
  const [criteria] = useConsolidatedReportCriteria();
  const ready = criteria.patient !== null && criteria.patient > 0 && isValidPeriod(criteria);
  const report = useConsolidatedPatientReportQuery(
    ready
      ? {
          patientId: criteria.patient!,
          fromDate: toApiDate(criteria.from!),
          toDate: toApiDate(criteria.to!),
        }
      : null
  );

  // Once per report shown: the length of its period, never the Patient or the dates.
  const recordedReport = useRef<string | null>(null);
  const shownReport =
    ready && report.isSuccess ? `${criteria.patient}|${criteria.from}|${criteria.to}` : null;

  useEffect(() => {
    if (!shownReport || recordedReport.current === shownReport) {
      return;
    }

    recordedReport.current = shownReport;
    captureAnalyticsEvent('consolidated_report_opened', {
      period_days: periodDays({ from: criteria.from!, to: criteria.to! }),
    });
  }, [shownReport, criteria.from, criteria.to]);

  if (!ready) {
    return (
      <EmptyState
        tone="neutral"
        actions={<BackToReports />}
        title="Nothing to generate yet"
        className="bg-card min-h-72 border"
        icon={PiFileMagnifyingGlassDuotone}
        description="Choose a Patient and a date range on the Reports page to generate this report."
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {report.isPending ? (
        <>
          <div className="print:hidden">
            <BackToReports />
          </div>
          <ReportDocumentSkeleton />
        </>
      ) : report.isError ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-xl border p-4" role="alert">
          <p className="text-destructive text-sm">{getApiErrorMessage(report.error)}</p>
          <div className="flex gap-2">
            <BackToReports />
            <Button type="button" variant="outline" onClick={() => void report.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ReportToolbar report={report.data} back={<BackToReports />} onPrint={printReport} />
          <ConsolidatedReportDocument report={report.data} />
        </>
      )}
    </div>
  );
}
