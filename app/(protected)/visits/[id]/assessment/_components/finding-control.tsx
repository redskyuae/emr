import type { Dispatch } from 'react';
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
        'grid min-h-8 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1 rounded border px-1.5 py-1',
        finding.status === 'abnormal' && 'border-destructive/40 bg-destructive/5'
      )}
    >
      <span className="truncate text-[10px] font-medium" title={finding.label}>
        {finding.label}
      </span>
      <div className="flex rounded border bg-background p-0.5">
        <button
          aria-label={`${finding.label}: Normal`}
          aria-pressed={finding.status === 'normal'}
          className={cn(
            'rounded px-1.5 py-0.5 text-[9px] font-medium leading-none',
            finding.status === 'normal'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
          disabled={disabled}
          onClick={() => dispatch({ type: 'update-finding', target, id: finding.id, status: 'normal' })}
          type="button"
        >
          Normal
        </button>
        <button
          aria-label={`${finding.label}: Abnormal`}
          aria-pressed={finding.status === 'abnormal'}
          className={cn(
            'rounded px-1.5 py-0.5 text-[9px] font-medium leading-none',
            finding.status === 'abnormal'
              ? 'bg-destructive text-destructive-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
          disabled={disabled}
          onClick={() =>
            dispatch({ type: 'update-finding', target, id: finding.id, status: 'abnormal' })
          }
          type="button"
        >
          Abnormal
        </button>
      </div>
      {finding.status === 'abnormal' && finding.remarks ? (
        <p className="col-span-2 mt-0.5 line-clamp-1 text-[9px] text-destructive" title={finding.remarks}>
          {finding.remarks}
        </p>
      ) : null}
    </div>
  );
}
