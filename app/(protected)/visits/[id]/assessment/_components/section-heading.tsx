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
    <div className="bg-muted/35 flex min-h-7 items-center justify-between gap-2 border-b px-2 py-1">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <h3 className="text-foreground shrink-0 text-[11px] font-semibold tracking-wide uppercase">
          {title}
        </h3>
        {context ? (
          <span className="text-muted-foreground truncate text-[8px] font-medium tracking-normal normal-case">
            · {context}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}
