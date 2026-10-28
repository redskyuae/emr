'use client';

import { useState } from 'react';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { AlertCircle, RefreshCcw, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import type { PatientFormValues } from '@/app/(protected)/patients/_utils/patient-form-schema';
import {
  patientFormValuesToRequest,
  patientToFormValues,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useUpdatePatient } from '@/app/queries/patients/useUpdatePatient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

function PatientRegistrationSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Patient registration">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      {[0, 1, 2, 3, 4, 5].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PatientRegistrationSection({
  patient,
  loading,
  error,
  onRetry,
  onContinue,
  continuing,
}: {
  patient: Patient | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onContinue: () => Promise<void> | void;
  continuing: boolean;
}) {
  const [formRevision, setFormRevision] = useState(0);
  const updatePatient = useUpdatePatient();

  if (loading) {
    return <PatientRegistrationSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Patient information</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{getApiErrorMessage(error)}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="size-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!patient) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-56 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRound className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Patient information</EmptyTitle>
          <EmptyDescription>
            Select a Patient or Appointment to load the registration record.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const defaultValues: PatientFormValues = patientToFormValues(patient);
  const formKey = `${patient.id}-${formRevision}`;

  return (
    <section className="space-y-4" aria-labelledby="patient-information-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="patient-information-heading" className="font-heading text-lg font-semibold">
            Patient information
          </h2>
          <p className="text-muted-foreground text-sm">
            Registration details loaded from the Patient record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono">
            {patient.mrn}
          </Badge>
          <Badge variant={patient.registrationStatus === 'registered' ? 'secondary' : 'outline'}>
            {patient.registrationStatus === 'registered' ? 'Registered' : 'Provisional'}
          </Badge>
        </div>
      </div>

      {patient.registrationStatus === 'registered' ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={continuing}
            onClick={() => void onContinue()}
          >
            {continuing ? 'Checking Visit history…' : 'Continue with existing details'}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Complete and save Patient registration before creating the Visit.
        </p>
      )}

      <PatientForm
        key={formKey}
        mode="edit"
        mrn={patient.mrn}
        defaultValues={defaultValues}
        isSaving={updatePatient.isPending}
        submitAction="next"
        submitLabel="Save and continue"
        onCancel={() => setFormRevision((current) => current + 1)}
        onSave={async (values) => {
          await updatePatient.mutateAsync({
            patientId: patient.id,
            request: patientFormValuesToRequest(values),
          });
          toast.success('Patient information updated.');
          await onContinue();
        }}
      />
    </section>
  );
}
