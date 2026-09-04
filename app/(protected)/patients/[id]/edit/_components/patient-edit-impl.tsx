'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserRoundX, UsersRound } from 'lucide-react';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import {
  patientFormValuesToRequest,
  patientToFormValues,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useUpdatePatient } from '@/app/queries/patients/useUpdatePatient';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

function BackLink({ patientId }: { patientId: number }) {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href={`/patients/${patientId}`}>
        <ArrowLeft className="size-4" />
        Back to Patient
      </Link>
    </Button>
  );
}

export function PatientEditImpl({ patientId }: { patientId: number }) {
  const router = useRouter();
  const patientQuery = usePatientQuery(patientId);
  const updatePatient = useUpdatePatient();
  const { data: canUpdate } = useHasPermission('patient:update');

  if (!canUpdate) {
    return (
      <div className="space-y-4">
        <BackLink patientId={patientId} />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundX className="size-5" />
            </EmptyMedia>
            <EmptyTitle>You don&apos;t have permission to edit Patients.</EmptyTitle>
            <EmptyDescription>Contact a Tenant Admin if you need access.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (patientQuery.isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading Patient">
        {[0, 1, 2].map((section) => (
          <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <div className="space-y-4">
        <BackLink patientId={patientId} />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Patient not found</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(patientQuery.error)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const patient = patientQuery.data;

  return (
    <div className="space-y-4">
      <BackLink patientId={patientId} />

      <PatientForm
        key={patient.id}
        mode="edit"
        mrn={patient.mrn}
        defaultValues={patientToFormValues(patient)}
        isSaving={updatePatient.isPending}
        onCancel={() => router.push(`/patients/${patientId}`)}
        onSave={async (values) => {
          await updatePatient.mutateAsync({
            patientId,
            request: patientFormValuesToRequest(values),
          });
          toast.success('Patient updated.');
          router.push(`/patients/${patientId}`);
        }}
      />
    </div>
  );
}
