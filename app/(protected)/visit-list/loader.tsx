import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';

const COLUMNS = ['Token', 'Visit', 'Patient', 'Date', 'Doctor', 'Type', 'Status', 'Billing'];

export default function VisitListPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Skeleton className="h-16 rounded-lg" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-card flex flex-col gap-1.5 rounded-lg border p-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-14" />
            {index === 5 ? <Skeleton className="h-4 w-36 max-w-full" /> : null}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-full sm:w-auto sm:min-w-64 sm:flex-1 xl:max-w-sm" />
          <Skeleton className="h-10 w-full sm:w-96" />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
          </div>
          <Skeleton className="h-10 w-44" />
          <Skeleton className="ml-auto h-10 w-32" />
        </CardContent>
      </Card>

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                {COLUMNS.map((column) => (
                  <th key={column} className={tableHeadCellClass}>
                    {column}
                  </th>
                ))}
                <th className={`${tableHeadCellClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="size-9 rounded-md" />
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="ml-auto h-8 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
