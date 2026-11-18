import { PatientFormSkeleton } from '@/app/(protected)/patients/_components/patient-form-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

// Registration renders the same PatientForm as Patient edit, without the MRN card, so it
// reuses the shared form skeleton and adds its own Cancel / Register patient row.
export default function PatientRegistrationLoader() {
  return (
    <div className="space-y-6" aria-label="Loading Patient form">
      <PatientFormSkeleton />

      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}
