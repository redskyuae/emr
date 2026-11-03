import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TherapistsPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-full lg:max-w-xs" />
          <Skeleton className="h-9 w-full lg:w-36" />
        </CardContent>
      </Card>
      <Card className="shadow-fluent-2">
        <CardContent className="space-y-4 p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
