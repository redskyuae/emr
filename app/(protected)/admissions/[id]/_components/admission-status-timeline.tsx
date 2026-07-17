'use client';

import { CheckCircle2, LogIn, XCircle } from 'lucide-react';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { cn } from '@/lib/utils';

function formatMoment(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

export function AdmissionStatusTimeline({ admission }: { admission: Admission }) {
  const steps = [
    {
      key: 'admitted',
      label: 'Admitted',
      icon: LogIn,
      at: formatMoment(admission.admittedAt),
      reached: true,
    },
  ];

  if (admission.status === 'CANCELLED') {
    steps.push({
      key: 'cancelled',
      label: 'Cancelled',
      icon: XCircle,
      at: formatMoment(admission.cancelledAt),
      reached: true,
    });
  } else {
    steps.push({
      key: 'discharged',
      label: 'Discharged',
      icon: CheckCircle2,
      at: formatMoment(admission.dischargedAt),
      reached: admission.dischargedAt !== null,
    });
  }

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      {steps.map((step) => {
        const Icon = step.icon;

        return (
          <li key={step.key} className="flex items-center gap-2">
            <Icon
              className={cn(
                'size-4',
                step.reached ? 'text-primary' : 'text-muted-foreground/50',
                step.key === 'cancelled' && 'text-destructive'
              )}
            />
            <div className="text-sm">
              <p className={cn('font-medium', !step.reached && 'text-muted-foreground/70')}>
                {step.label}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">{step.at ?? '—'}</p>
            </div>
          </li>
        );
      })}
      {admission.expectedDischargeDate && admission.status === 'ADMITTED' ? (
        <li className="text-muted-foreground text-sm sm:ml-auto">
          Expected discharge:{' '}
          <span className="tabular-nums">{admission.expectedDischargeDate}</span>
        </li>
      ) : null}
    </ol>
  );
}
