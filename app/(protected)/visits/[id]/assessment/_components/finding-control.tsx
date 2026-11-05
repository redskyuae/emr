import type { Dispatch } from 'react';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        'grid gap-2 rounded-md border p-2',
        finding.status === 'abnormal' && 'border-destructive/40 bg-destructive/5'
      )}
      data-testid={`${target}-finding-${finding.id}`}
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <span className="text-sm font-medium">{finding.label}</span>
        <div className="flex gap-1" role="group" aria-label={`${finding.label} finding status`}>
          <Button
            aria-label={`${finding.label}: Normal`}
            aria-pressed={finding.status === 'normal'}
            disabled={disabled}
            onClick={() =>
              dispatch({ type: 'update-finding', target, id: finding.id, status: 'normal' })
            }
            size="xs"
            type="button"
            variant={finding.status === 'normal' ? 'default' : 'outline'}
          >
            <CheckIcon aria-hidden="true" />
            Normal
          </Button>
          <Button
            aria-label={`${finding.label}: Abnormal`}
            aria-pressed={finding.status === 'abnormal'}
            disabled={disabled}
            onClick={() =>
              dispatch({ type: 'update-finding', target, id: finding.id, status: 'abnormal' })
            }
            size="xs"
            type="button"
            variant={finding.status === 'abnormal' ? 'destructive' : 'outline'}
          >
            <TriangleAlertIcon aria-hidden="true" />
            Abnormal
          </Button>
        </div>
      </div>

      {finding.status === 'abnormal' ? (
        <label>
          <span className="text-destructive mb-1 block text-xs font-medium">Abnormal finding</span>
          <Input
            aria-label={`${finding.label} abnormal remarks`}
            className="border-destructive/40"
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
        </label>
      ) : null}
    </div>
  );
}
