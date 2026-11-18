import { TherapistViewSkeleton } from '@/app/(protected)/therapists/_components/therapist-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TherapistsPageLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Therapists page">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-full lg:max-w-xs" />
          <Skeleton className="h-10 w-full lg:w-32" />
          <Skeleton className="h-9 w-full lg:ml-auto lg:w-36" />
        </CardContent>
      </Card>

      <TherapistViewSkeleton layout="table" />

      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}
