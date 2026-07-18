import { Skeleton } from '@/components/ui/skeleton';

export default function BillingPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <Skeleton className="h-9 w-full lg:w-48" />
        <div className="flex gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b">
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="p-3">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  {Array.from({ length: 6 }, (_, cell) => (
                    <td key={cell} className="p-3">
                      <Skeleton className="h-5 w-24" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
