'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import {
  EMPTY_PATIENT_FORM_VALUES,
  patientFormValuesToRequest,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { useRegisterPatient } from '@/app/queries/patients/useRegisterPatient';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function PatientRegistrationImpl() {
  const router = useRouter();
  const registerPatient = useRegisterPatient();
  const { data: canCreate } = useHasPermission('patient:create');

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/patients">
            <ArrowLeft className="size-4" />
            Patients
          </Link>
        </Button>
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundX className="size-5" />
            </EmptyMedia>
            <EmptyTitle>You don&apos;t have permission to register Patients.</EmptyTitle>
            <EmptyDescription>Contact a Tenant Admin if you need access.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

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
