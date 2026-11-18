import Link from 'next/link';
import { PiArrowLeftLight, PiCheckLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StepState = 'done' | 'active' | 'next';

function Step({ number, label, state }: { number: number; label: string; state: StepState }) {
  return (
    <li className="flex items-center gap-2" aria-current={state === 'active' ? 'step' : undefined}>
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full border text-xs font-bold',
          state === 'done' && 'border-success bg-success text-primary-foreground',
          state === 'active' && 'border-primary bg-primary text-primary-foreground',
          state === 'next' && 'text-muted-foreground'
        )}
      >
        {state === 'done' ? <PiCheckLight className="size-4" aria-label="Done" /> : number}
      </span>
      <span className={cn('text-sm font-semibold', state === 'next' && 'text-muted-foreground')}>
        {label}
      </span>
    </li>
  );
}

export function CheckInHeader({
  referenceDate,
  confirmed,
}: {
  referenceDate: string | null;
  confirmed: boolean;
}) {
  return (
    <header className="bg-card shadow-fluent-2 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4">
      <div className="space-y-1">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/visits">
            <PiArrowLeftLight className="size-4" />
            Visits
          </Link>
        </Button>
        {referenceDate ? (
          <p className="text-muted-foreground text-sm">
            Visit date <span className="font-mono">{referenceDate}</span>
          </p>
        ) : null}
      </div>
      <ol aria-label="Check-in progress" className="flex flex-wrap items-center gap-3">
        <Step number={1} label="Patient" state={confirmed ? 'done' : 'active'} />
        <li aria-hidden className="bg-border hidden h-px w-8 sm:block" />
        {/* Visit and Billing are filled on one screen, so they are one step: only one is ever current. */}
        <Step number={2} label="Visit & Billing" state={confirmed ? 'active' : 'next'} />
      </ol>
    </header>
  );
}
