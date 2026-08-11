import { Skeleton } from '@/components/ui/skeleton';

export default function ReligionsPageLoader() {
  return <ReligionLoader />;
}

function ReligionLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-full lg:max-w-sm" />
        <div className="flex gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 pl-4">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-10" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-24" />
                </th>
                <th className="p-3 pr-4 text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="p-3 pl-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-5 w-28" />
                  </td>
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
