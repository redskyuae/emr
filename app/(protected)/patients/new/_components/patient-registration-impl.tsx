'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PiArrowLeftLight, PiLockKeyDuotone } from 'react-icons/pi';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import {
  EMPTY_PATIENT_FORM_VALUES,
  patientFormValuesToRequest,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { useRegisterPatient } from '@/app/queries/patients/useRegisterPatient';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientFormAnalytics } from '@/app/(protected)/patients/_components/use-patient-form-analytics';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';

export function PatientRegistrationImpl() {
  const router = useRouter();
  const registerPatient = useRegisterPatient();
  const { data: canCreate } = useHasPermission('patient:create');
  const analytics = usePatientFormAnalytics(canCreate ? 'register' : null);

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/patients">
            <PiArrowLeftLight className="size-4" />
            Patients
          </Link>
        </Button>
        <EmptyState
          tone="danger"
          orbit={false}
          className="min-h-72"
          icon={PiLockKeyDuotone}
          title="You don't have permission to register Patients."
          description="Contact a Tenant Admin if you need access."
        />
      </div>
    );
  }

  return (
    <PatientForm
      mode="create"
      defaultValues={EMPTY_PATIENT_FORM_VALUES}
      isSaving={registerPatient.isPending}
      onCancel={() => router.push('/patients')}
      onInvalid={analytics.recordInvalid}
      onSave={async (values) => {
        analytics.recordSubmitted(values);
        const result = await registerPatient.mutateAsync(patientFormValuesToRequest(values));
        analytics.recordSaved();
        toast.success(`Patient registered as ${result.data.mrn}.`);
        router.push(`/patients/${result.data.id}`);
      }}
    />
  );
}
