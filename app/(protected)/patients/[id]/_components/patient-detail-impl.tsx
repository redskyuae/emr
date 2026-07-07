'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useReactivatePatient } from '@/app/queries/patients/useReactivatePatient';
import {
  getPatientGenderLabel,
  getPatientGovtIdTypeLabel,
  getPatientMaritalStatusLabel,
} from '@/app/(protected)/patients/_utils/patient-value-sets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { DeactivatePatientDialog } from './_modals/deactivate-patient-dialog';
import { DeletePatientDialog } from './_modals/delete-patient-dialog';

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading Patient">
      <div className="bg-card shadow-fluent-2 rounded-xl border p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      {[0, 1, 2, 3, 4].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PatientDetailImpl({ patientId }: { patientId: number }) {
  const patientQuery = usePatientQuery(patientId);
  const reactivateMutation = useReactivatePatient();
  const [patientPendingDeactivate, setPatientPendingDeactivate] = useState<Patient | null>(null);
  const [patientPendingDelete, setPatientPendingDelete] = useState<Patient | null>(null);

  if (patientQuery.isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <div className="space-y-4">
        <BackLink />
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

  function handleReactivate() {
    reactivateMutation.mutate(patient.id, {
      onSuccess: () => toast.success(`${patient.firstName} ${patient.lastName} reactivated.`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">
                {patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}
                {patient.lastName}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  patient.isActive
                    ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
                    : 'bg-muted/60 text-muted-foreground'
                )}
              >
                {patient.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">MRN {patient.mrn}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/patients/${patient.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            {patient.isActive ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPatientPendingDeactivate(patient)}
              >
                <UserRoundX className="size-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={reactivateMutation.isPending}
                onClick={handleReactivate}
              >
                <UserRoundCheck className="size-4" />
                Reactivate
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="More actions">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setPatientPendingDelete(patient)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Gender" value={getPatientGenderLabel(patient.gender)} />
          <DetailField label="Date of birth" value={patient.dateOfBirth} />
          <DetailField label="Blood group" value={patient.bloodGroup} />
          <DetailField
            label="Marital status"
            value={
              patient.maritalStatus ? getPatientMaritalStatusLabel(patient.maritalStatus) : null
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Phone" value={patient.phone} />
          <DetailField label="Alternate phone" value={patient.alternatePhone} />
          <DetailField label="Email" value={patient.email} />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Address line 1" value={patient.addressLine1} />
          <DetailField label="Address line 2" value={patient.addressLine2} />
          <DetailField label="City" value={patient.city} />
          <DetailField label="State" value={patient.state?.name} />
          <DetailField label="Country" value={patient.country?.name} />
          <DetailField label="Postal code" value={patient.postalCode} />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Identifiers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Nationality" value={patient.nationality?.name} />
          <DetailField label="Preferred language" value={patient.language?.name} />
          <DetailField label="Religion" value={patient.religion?.name} />
          <DetailField
            label="Government ID type"
            value={patient.govtIdType ? getPatientGovtIdTypeLabel(patient.govtIdType) : null}
          />
          <DetailField label="Government ID number" value={patient.govtIdNumber} />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Name" value={patient.emergencyContactName} />
          <DetailField label="Relationship" value={patient.emergencyContactRelationship} />
          <DetailField label="Phone" value={patient.emergencyContactPhone} />
        </CardContent>
      </Card>

      <DeactivatePatientDialog
        patient={patientPendingDeactivate}
        onClose={() => setPatientPendingDeactivate(null)}
      />
      <DeletePatientDialog
        patient={patientPendingDelete}
        onClose={() => setPatientPendingDelete(null)}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/patients">
        <ArrowLeft className="size-4" />
        Patients
      </Link>
    </Button>
  );
}
