import { AyurvedaDiagnosisCodeTableSkeleton } from '@/app/(protected)/clinical-masters/ayurveda-diagnosis-codes/_components/ayurveda-diagnosis-code-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AyurvedaDiagnosisCodesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Ayurveda Diagnosis Codes">
      <Card>
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Skeleton className="h-9 w-full lg:max-w-sm" />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
            <Skeleton className="h-9 w-64" />
          </div>
        </CardContent>
      </Card>

      <AyurvedaDiagnosisCodeTableSkeleton canEdit canDelete />
    </div>
  );
}
