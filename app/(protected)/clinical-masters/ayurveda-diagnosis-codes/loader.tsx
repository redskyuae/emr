import { Skeleton } from '@/components/ui/skeleton';

const COLUMN_WIDTHS = ['w-12', 'w-12', 'w-24', 'w-16', 'w-32'];
const CELL_WIDTHS = ['w-20', 'w-32', 'w-36', 'w-24', 'w-48'];

export default function AyurvedaDiagnosisCodesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
          <Skeleton className="h-9 w-56" />
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead>
              <tr className="border-b">
                {COLUMN_WIDTHS.map((width, index) => (
                  <th key={index} className={index === 0 ? 'p-3 pl-4' : 'p-3'}>
                    <Skeleton className={`h-4 ${width}`} />
                  </th>
                ))}
                <th className="p-3 pr-4 text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, row) => (
                <tr key={row} className="border-b last:border-b-0">
                  {CELL_WIDTHS.map((width, index) => (
                    <td key={index} className={index === 0 ? 'p-3 pl-4' : 'p-3'}>
                      <Skeleton className={`h-5 ${width}`} />
                    </td>
                  ))}
                  <td className="p-3 pr-4 text-right">
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
