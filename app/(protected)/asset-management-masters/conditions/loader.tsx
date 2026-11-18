import { Skeleton } from '@/components/ui/skeleton';

export default function AssetConditionsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <div className="bg-card shadow-fluent-2 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-full lg:max-w-sm" />
      </div>

      <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground border-b text-xs tracking-wider uppercase">
                <th className="p-3 pl-5">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-10" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-12" />
                </th>
                <th className="p-3">
                  <Skeleton className="h-4 w-20" />
                </th>
                <th className="p-3 pr-5 text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-3 py-3.5 pl-5">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="px-3 py-3.5">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-3 py-3.5">
                    <Skeleton className="size-4 rounded-sm" />
                  </td>
                  <td className="px-3 py-3.5">
                    <Skeleton className="h-5 w-40" />
                  </td>
                  <td className="px-3 py-3.5 pr-5 text-right">
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
