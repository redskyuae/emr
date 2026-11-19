import type { ReactNode } from 'react';

import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';
import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { cn } from '@/lib/utils';

import { dateTimeIn, patientFullName } from '../_utils/visit-summary-format';
import { type PillTone, StatusPill } from './summary-section';

const VISIT_STATUS: Record<VisitStatus, { label: string; tone: PillTone }> = {
  CHECKED_IN: { label: 'Checked In', tone: 'muted' },
  IN_CONSULTATION: { label: 'In Consultation', tone: 'primary' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'destructive' },
};

/** One A4 sheet: header, the blocks placed on it, and the page footer pinned to the bottom. */
export function SummaryPage({
  header,
  footer,
  children,
  className,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      data-visit-summary-page
      className={cn(
        'bg-card text-foreground flex h-[297mm] w-[210mm] flex-none flex-col overflow-hidden px-12 pt-10 pb-6',
        className
      )}
    >
      {header}
      <div className="min-h-0 flex-1">{children}</div>
      {footer}
    </article>
  );
}

function TenantMark({ tenant, size }: { tenant: VisitSummary['tenant']; size: 'lg' | 'sm' }) {
  const box = size === 'lg' ? 'size-12 rounded-xl text-2xl' : 'size-7 rounded-md text-sm';

  if (tenant.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- Tenant logos are arbitrary uploaded URLs.
    return <img src={tenant.logo} alt="" className={cn(box, 'flex-none object-contain')} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        'bg-primary text-primary-foreground grid flex-none place-items-center font-bold'
      )}
    >
      {tenant.name.charAt(0).toUpperCase()}
    </span>
  );
}

function CopyLabel() {
  return (
    <span className="bg-primary/10 text-primary inline-flex rounded-md px-2 py-0.5 text-[12px] font-semibold">
      Patient copy
    </span>
  );
}

/** First-page letterhead: Tenant, copy type, title, Visit Number and Visit Status. */
export function SummaryLetterhead({ summary }: { summary: VisitSummary }) {
  const status = VISIT_STATUS[summary.visit.status];

  return (
    <header className="border-foreground flex items-start justify-between gap-6 border-b-2 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <TenantMark tenant={summary.tenant} size="lg" />
        <div className="min-w-0">
          <p className="font-heading truncate text-[19px] leading-tight font-bold">
            {summary.tenant.name}
          </p>
          <div className="mt-1.5">
            <CopyLabel />
          </div>
        </div>
      </div>
      <div className="flex-none text-right">
        <h1 className="font-heading text-[25px] leading-tight font-bold tracking-[-0.01em]">
          Visit Summary
        </h1>
        <p className="mt-1.5 flex items-center justify-end gap-2.5">
          <span className="font-mono text-[13px] font-medium">{summary.visit.visitNumber}</span>
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </p>
      </div>
    </header>
  );
}

/** Header repeated on every page after the first. */
export function SummaryRunningHeader({ summary }: { summary: VisitSummary }) {
  return (
    <header className="border-border flex items-center justify-between gap-4 border-b pb-3">
      <p className="flex min-w-0 items-center gap-2 text-[13px]">
        <TenantMark tenant={summary.tenant} size="sm" />
        <span className="truncate">
          <span className="font-semibold">Visit Summary</span>
          <span className="text-muted-foreground">
            {' '}
            · {summary.visit.visitNumber} · {patientFullName(summary.patient)} ·{' '}
            <span className="text-foreground font-mono">{summary.patient.mrn}</span>
          </span>
        </span>
      </p>
      <CopyLabel />
    </header>
  );
}

export function SummaryFooter({
  summary,
  page,
  pageCount,
}: {
  summary: VisitSummary;
  page: number;
  pageCount: number;
}) {
  return (
    <footer className="border-border text-muted-foreground mt-4 flex items-center justify-between gap-4 border-t pt-3 text-[11px]">
      <p>
        Generated {dateTimeIn(summary.generatedAt, summary.timeZone)}
        {summary.generatedBy ? ` by ${summary.generatedBy}` : ''} · Times in {summary.timeZone}
      </p>
      <p className="text-foreground flex-none font-semibold">
        Page {page} of {pageCount}
      </p>
    </footer>
  );
}
