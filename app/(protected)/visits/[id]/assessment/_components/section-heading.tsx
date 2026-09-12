import type { ReactNode } from 'react';

export function SectionHeading({
  title,
  context,
  action,
}: {
  title: string;
  context?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-muted/35 flex min-h-12 items-center justify-between gap-3 border-b px-4 py-2">
      <div className="min-w-0">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {context ? <p className="text-muted-foreground text-xs">{context}</p> : null}
      </div>
      {action}
    </div>
  );
}
