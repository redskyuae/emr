import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** A small uppercase section title in the primary colour, with an optional note on the right. */
export function ReportSectionHeading({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-primary text-[11px] font-bold tracking-[0.14em] uppercase">{title}</h2>
      {aside ? <p className="text-muted-foreground text-[11.5px]">{aside}</p> : null}
    </div>
  );
}

/** A bordered table in the report's dense printed style. */
export function ReportTable({
  head,
  rows,
  className,
  headClassName,
}: {
  head: { label: string; className?: string }[];
  rows: ReactNode[][];
  className?: string;
  headClassName?: string;
}) {
  return (
    <div className={cn('border-border overflow-x-auto border', className)}>
      {/* Fixed layout keeps each column at its set width however long the text in it is. */}
      <table className="w-full table-fixed border-collapse text-[11.5px] leading-snug [overflow-wrap:anywhere]">
        <thead className={cn('bg-muted text-left text-[11.5px]', headClassName)}>
          <tr>
            {head.map((cell) => (
              <th
                key={cell.label}
                scope="col"
                className={cn('px-2.5 py-2 font-semibold', cell.className)}
              >
                {cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-border break-inside-avoid border-t">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    'border-border px-2.5 py-2 align-top not-last:border-r',
                    head[cellIndex]?.className
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
