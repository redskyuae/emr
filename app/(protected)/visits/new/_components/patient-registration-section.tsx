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
import { useCountryOptionsQuery } from '@/app/queries/global-references/countries/useCountries';
import { useLanguageOptionsQuery } from '@/app/queries/global-references/languages/useLanguages';
import { useNationalityOptionsQuery } from '@/app/queries/global-references/nationalities/useNationalities';
import { useReligionOptionsQuery } from '@/app/queries/global-references/religions/useReligions';
import { useStateOptionsQuery } from '@/app/queries/global-references/states/useStates';
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

function findReferenceIdByName(
  options: Array<{ id: number; name: string }> | undefined,
  name: string
): number | undefined {
  return options?.find((option) => option.name.toLowerCase() === name.toLowerCase())?.id;
}

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
  isDemo,
  onRetry,
  onContinue,
}: {
  patient: Patient | null;
  loading: boolean;
  error: unknown;
  isDemo?: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const [formRevision, setFormRevision] = useState(0);
  const updatePatient = useUpdatePatient();

  const countryOptionsQuery = useCountryOptionsQuery();
  const nationalityOptionsQuery = useNationalityOptionsQuery();
  const languageOptionsQuery = useLanguageOptionsQuery();
  const religionOptionsQuery = useReligionOptionsQuery();
  const demoCountryId = findReferenceIdByName(countryOptionsQuery.data, 'United Arab Emirates');
  const stateOptionsQuery = useStateOptionsQuery(isDemo ? (demoCountryId ?? null) : null);
  const demoStateId = findReferenceIdByName(stateOptionsQuery.data, 'Dubai');
  const demoNationalityId = findReferenceIdByName(nationalityOptionsQuery.data, 'Emirati');
  const demoLanguageId = findReferenceIdByName(languageOptionsQuery.data, 'Arabic');
  const demoReligionId = findReferenceIdByName(religionOptionsQuery.data, 'Islam');

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

  const defaultValues: PatientFormValues = isDemo
    ? {
        ...patientToFormValues(patient),
        countryId: demoCountryId,
        stateId: demoStateId,
        nationalityId: demoNationalityId,
        languageId: demoLanguageId,
        religionId: demoReligionId,
        identityDocuments: patientToFormValues(patient).identityDocuments.map((document) => ({
          documentType: document.documentType,
          documentNumber: document.documentNumber,
          issuingCountryId:
            document.documentType === 'passport' ? demoCountryId : document.issuingCountryId,
          expiryDate: document.expiryDate,
          label: document.label,
        })),
      }
    : patientToFormValues(patient);

  const formKey = isDemo
    ? `demo-${patient.id}-${formRevision}-${demoCountryId}-${demoStateId}-${demoNationalityId}-${demoLanguageId}-${demoReligionId}`
    : `${patient.id}-${formRevision}`;

  return (
    <section className="space-y-4" aria-labelledby="patient-information-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="patient-information-heading" className="font-heading text-lg font-semibold">
            Patient information
          </h2>
          <p className="text-muted-foreground text-sm">
            {isDemo
              ? 'Demo Patient — static data used to preview the Visit workflow.'
              : 'Registration details loaded from the Patient record.'}
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
          if (isDemo) {
            toast.success('Demo Patient details loaded.');
            onContinue();
            return;
          }
          await updatePatient.mutateAsync({
            patientId: patient.id,
            request: patientFormValuesToRequest(values),
          });
          toast.success('Patient information updated.');
          onContinue();
        }}
      />
    </section>
  );
}
