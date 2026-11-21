import { ViewSkeleton } from '@/app/(protected)/clinical-masters/diagnosis-codes/_components/diagnosis-code-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DiagnosisCodesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Diagnosis Codes">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" canEdit canDelete />
    </div>
  );
}
