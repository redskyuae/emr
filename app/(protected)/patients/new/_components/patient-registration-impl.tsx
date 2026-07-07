'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import {
  EMPTY_PATIENT_FORM_VALUES,
  patientFormValuesToRequest,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { useRegisterPatient } from '@/app/queries/patients/useRegisterPatient';

export function PatientRegistrationImpl() {
  const router = useRouter();
  const registerPatient = useRegisterPatient();

  return (
    <PatientForm
      mode="create"
      defaultValues={EMPTY_PATIENT_FORM_VALUES}
      isSaving={registerPatient.isPending}
      onCancel={() => router.push('/patients')}
      onSave={async (values) => {
        const result = await registerPatient.mutateAsync(patientFormValuesToRequest(values));
        toast.success(`Patient registered as ${result.data.mrn}.`);
        router.push(`/patients/${result.data.id}`);
      }}
    />
  );
}
