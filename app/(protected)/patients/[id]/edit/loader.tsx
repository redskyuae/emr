import { PatientEditFormSkeleton } from '@/app/(protected)/patients/[id]/edit/_components/patient-edit-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientEditLoader() {
  return (
    <div className="space-y-4" aria-label="Loading page">
      {/* The "Back to Patient" link. */}
      <Skeleton className="h-8 w-32" />

      <PatientEditFormSkeleton />
    </div>
  );
}
