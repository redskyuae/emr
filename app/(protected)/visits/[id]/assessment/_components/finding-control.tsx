import type { Dispatch } from 'react';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClinicalFinding } from '../../../_data/static-clinician-visits';
import type { AssessmentAction } from '../_utils/assessment-state';

export function FindingControl({
  finding,
  target,
  dispatch,
  disabled,
}: {
  finding: ClinicalFinding;
  target: 'ros' | 'exam';
  dispatch: Dispatch<AssessmentAction>;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        'grid min-h-5 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-0.5 rounded border px-1 py-0.5',
        finding.status === 'abnormal' && 'border-destructive/40 bg-destructive/5'
      )}
      data-testid={`${target}-finding-${finding.id}`}
    >
      <span className="truncate text-[9px] font-medium" title={finding.label}>
        {finding.label}
      </span>
      <div className="bg-background flex rounded border p-0.5">
        <button
          aria-label={`${finding.label}: Normal`}
          aria-pressed={finding.status === 'normal'}
          className={cn(
            'rounded px-1 py-0.5 text-[8px] leading-none font-medium',
            finding.status === 'normal'
              ? 'bg-primary text-primary-foreground ring-primary ring-1'
              : 'text-muted-foreground hover:bg-muted'
          )}
          disabled={disabled}
          onClick={() =>
            dispatch({ type: 'update-finding', target, id: finding.id, status: 'normal' })
          }
          type="button"
        >
          <CheckIcon className="mr-0.5 inline size-2.5" aria-hidden="true" />
          Normal
        </button>
        <button
          aria-label={`${finding.label}: Abnormal`}
          aria-pressed={finding.status === 'abnormal'}
          className={cn(
            'rounded px-1 py-0.5 text-[8px] leading-none font-medium',
            finding.status === 'abnormal'
              ? 'bg-destructive text-destructive-foreground ring-destructive ring-1'
              : 'text-muted-foreground hover:bg-muted'
          )}
          disabled={disabled}
          onClick={() =>
            dispatch({ type: 'update-finding', target, id: finding.id, status: 'abnormal' })
          }
          type="button"
        >
          <TriangleAlertIcon className="mr-0.5 inline size-2.5" aria-hidden="true" />
          Abnormal
        </button>
      </div>
      {finding.status === 'abnormal' ? (
        <input
          aria-label={`${finding.label} abnormal remarks`}
          className="text-destructive border-destructive/30 focus:border-destructive col-span-2 min-w-0 border-b bg-transparent text-[8px] leading-3 outline-none disabled:opacity-70"
          disabled={disabled}
          onChange={(event) =>
            dispatch({
              type: 'update-finding-remarks',
              target,
              id: finding.id,
              remarks: event.target.value,
            })
          }
          value={finding.remarks}
        />
      ) : null}
    </div>
  );
}
