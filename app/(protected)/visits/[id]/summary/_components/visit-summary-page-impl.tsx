'use client';

import Link from 'next/link';
import { PiArrowLeftLight, PiPrinterLight } from 'react-icons/pi';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVisitSummaryQuery } from '@/app/queries/visits/useVisitSummary';
import { Button } from '@/components/ui/button';

import { VisitSummarySheet } from './visit-summary-sheet';
import { VisitSummarySheetSkeleton } from './visit-summary-skeleton';

export function VisitSummaryPageImpl({ visitId }: { visitId: number }) {
  const summary = useVisitSummaryQuery(visitId);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="outline">
          <Link href={`/visits/${visitId}`}>
            <PiArrowLeftLight className="size-4" />
            Back to Visit
          </Link>
        </Button>
        {summary.data ? (
          <Button type="button" onClick={() => window.print()}>
            <PiPrinterLight className="size-4" />
            Print or save as PDF
          </Button>
        ) : null}
      </div>

      {summary.isPending ? (
        <VisitSummarySheetSkeleton />
      ) : summary.isError ? (
        <div className="bg-card flex flex-col items-start gap-3 rounded-xl border p-4" role="alert">
          <p className="text-destructive text-sm">{getApiErrorMessage(summary.error)}</p>
          <Button type="button" variant="outline" onClick={() => void summary.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <VisitSummarySheet summary={summary.data} />
      )}
    </div>
  );
}
