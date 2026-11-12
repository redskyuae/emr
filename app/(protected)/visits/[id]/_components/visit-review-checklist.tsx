import { Check } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ChecklistRow({
  label,
  detail,
  done,
  loading = false,
  optional = false,
  action,
}: {
  label: string;
  detail: string;
  done: boolean;
  loading?: boolean;
  optional?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
      {loading ? (
        <Skeleton className="size-6 shrink-0 rounded-full" />
      ) : (
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-full',
            done && 'bg-success text-primary-foreground',
            !done && (optional ? 'border-border border-2' : 'border-warning border-2')
          )}
        >
          {done ? <Check className="size-3.5" aria-hidden="true" /> : null}
          <span className="sr-only">{done ? 'Done' : optional ? 'Optional' : 'Open'}</span>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {loading ? (
          <Skeleton className="mt-1 h-3 w-28" />
        ) : (
          <span className="text-muted-foreground block text-xs">{detail}</span>
        )}
      </div>
      {!loading ? action : null}
    </li>
  );
}

function count(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`;
}

/** What is still open on the Visit before it is completed. Completion warns; it never blocks. */
export function VisitReviewChecklist({
  visit,
  vitalsCount,
  noteCount,
  signedNoteCount,
  invoiceCount,
  documentCount,
  chartLoading,
  invoicesLoading,
  invoicesError,
  documentsLoading,
  canRecordVitals,
  canRecordResponse,
  onRecordVitals,
  onDailyTreatment,
}: {
  visit: Visit;
  vitalsCount: number;
  noteCount: number;
  signedNoteCount: number;
  invoiceCount: number;
  documentCount: number;
  chartLoading: boolean;
  invoicesLoading: boolean;
  invoicesError: boolean;
  documentsLoading: boolean;
  canRecordVitals: boolean;
  canRecordResponse: boolean;
  onRecordVitals: () => void;
  onDailyTreatment: () => void;
}) {
  const action = (label: string, onClick: () => void) => (
    <Button type="button" size="sm" variant="outline" onClick={onClick}>
      {label}
    </Button>
  );

  return (
    <ul aria-label="Before completing this Visit" className="rounded-lg border">
      <ChecklistRow
        label="Vital Signs"
        loading={chartLoading}
        done={vitalsCount > 0}
        detail={
          vitalsCount ? `${count(vitalsCount, 'reading', 'readings')} recorded` : 'Not recorded'
        }
        action={!vitalsCount && canRecordVitals ? action('Record', onRecordVitals) : undefined}
      />
      <ChecklistRow
        label="Clinical Notes"
        loading={chartLoading}
        done={noteCount > 0 && signedNoteCount === noteCount}
        detail={
          noteCount
            ? `${count(noteCount, 'note', 'notes')} · ${signedNoteCount} signed`
            : 'None saved yet'
        }
      />
      {visit.treatmentSession ? (
        <ChecklistRow
          label={`Session ${visit.treatmentSession.sessionNumber}`}
          done={visit.status === 'COMPLETED'}
          detail="Record the treatment response when the Session ends"
          action={canRecordResponse ? action('Record', onDailyTreatment) : undefined}
        />
      ) : null}
      <ChecklistRow
        label="Invoice"
        loading={invoicesLoading}
        done={invoiceCount > 0}
        detail={
          invoicesError
            ? 'Could not load Invoices'
            : invoiceCount
              ? `${invoiceCount} linked`
              : 'Not created yet'
        }
      />
      <ChecklistRow
        label="Documents"
        loading={documentsLoading}
        optional
        done={documentCount > 0}
        detail={
          documentCount ? `${count(documentCount, 'file', 'files')} attached` : 'None attached'
        }
      />
    </ul>
  );
}
