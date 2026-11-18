import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';

export default function AdmitSourcesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full lg:max-w-sm" />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className={tableHeadCellClass}>
                  <Skeleton className="h-4 w-10" />
                </th>
                <th className={tableHeadCellClass}>
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className={cn(tableHeadCellClass, 'text-right')}>
                  <Skeleton className="ml-auto h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-5 w-48" />
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <Skeleton className="ml-auto h-8 w-8" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
