import type { ReactNode } from 'react';

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-2 border-b bg-muted/35 px-2 py-1">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      {action}
    </div>
  );
}
