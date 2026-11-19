import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** A printed section: an uppercase title over a heavy rule, with an optional note on the right. */
export function SummarySection({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="border-foreground flex items-end justify-between gap-3 border-b-2 pb-1.5">
        <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase">{title}</h2>
        {aside ? <div className="text-muted-foreground text-[11px]">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export type PillTone = 'success' | 'primary' | 'warning' | 'muted' | 'destructive';

const PILL_TONES: Record<PillTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

/** A tinted status pill with a leading dot, so the colour never carries the meaning alone. */
export function StatusPill({
  tone,
  children,
  dot = true,
}: {
  tone: PillTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
        PILL_TONES[tone]
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** A table header band and rows in the printed style. */
export function SummaryTable({
  head,
  children,
  className,
}: {
  head: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn('mt-2 w-full border-collapse text-[12.5px] leading-snug', className)}>
      <thead className="bg-muted text-muted-foreground text-left text-[12px]">
        <tr>{head}</tr>
      </thead>
      <tbody className="[&_td]:border-border [&_td]:border-b [&_td]:px-2.5 [&_td]:py-[7px] [&_td]:align-top">
        {children}
      </tbody>
    </table>
  );
}

export function SummaryTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn('px-2.5 py-1.5 font-semibold', className)}>{children}</th>;
}
