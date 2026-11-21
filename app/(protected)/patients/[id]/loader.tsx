import { PatientDetailSkeleton } from '@/app/(protected)/patients/[id]/_components/patient-detail-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientDetailLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      {/* The "Patients" back link. */}
      <Skeleton className="h-8 w-24" />

      <PatientDetailSkeleton />
    </div>
  );
}
