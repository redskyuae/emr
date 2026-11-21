'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PiArrowLeftLight, PiUserMinusLight, PiUsersLight } from 'react-icons/pi';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import { PatientFormSkeleton } from '@/app/(protected)/patients/_components/patient-form-skeleton';
import {
  patientFormValuesToRequest,
  patientToFormValues,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useUpdatePatient } from '@/app/queries/patients/useUpdatePatient';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientFormAnalytics } from '@/app/(protected)/patients/_components/use-patient-form-analytics';
import { patientEditFormMode } from '@/app/(protected)/patients/_utils/patient-form-analytics';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

// The edit form: the read-only MRN card, the form cards, then Cancel / Save changes.
export function PatientEditFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading Patient form">
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <span className="text-muted-foreground text-sm">Medical Record Number</span>
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>

      <PatientFormSkeleton />

      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

function BackLink({ patientId }: { patientId: number }) {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href={`/patients/${patientId}`}>
        <PiArrowLeftLight className="size-4" />
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
  // The mode is known once the Patient loads: completing a Provisional Patient or an edit.
  const analytics = usePatientFormAnalytics(
    canUpdate && patientQuery.data
      ? patientEditFormMode(patientQuery.data.registrationStatus)
      : null
  );

  if (!canUpdate) {
    return (
      <div className="space-y-4">
        <BackLink patientId={patientId} />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiUserMinusLight className="size-5" />
            </EmptyMedia>
            <EmptyTitle>You don&apos;t have permission to edit Patients.</EmptyTitle>
            <EmptyDescription>Contact a Tenant Admin if you need access.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (patientQuery.isError || (!patientQuery.isLoading && !patientQuery.data)) {
    return (
      <div className="space-y-4">
        <BackLink patientId={patientId} />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiUsersLight className="size-5" />
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

      <SkeletonCrossfade isLoading={patientQuery.isLoading} skeleton={<PatientEditFormSkeleton />}>
        {patient ? (
          <PatientForm
            key={patient.id}
            mode="edit"
            mrn={patient.mrn}
            defaultValues={patientToFormValues(patient)}
            isSaving={updatePatient.isPending}
            onCancel={() => router.push(`/patients/${patientId}`)}
            onInvalid={analytics.recordInvalid}
            onSave={async (values) => {
              analytics.recordSubmitted(values);
              await updatePatient.mutateAsync({
                patientId,
                request: patientFormValuesToRequest(values),
              });
              analytics.recordSaved();
              toast.success('Patient updated.');
              router.push(`/patients/${patientId}`);
            }}
          />
        ) : null}
      </SkeletonCrossfade>
    </div>
  );
}
