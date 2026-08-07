'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  UserRound,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import {
  formatEmiratesId,
  getPatientGenderLabel,
  getPatientIdentificationCategoryLabel,
  getPatientMaritalStatusLabel,
  getPatientPaymentMethodLabel,
} from '@/app/(protected)/patients/_utils/patient-value-sets';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { IdentityDocumentsTable } from './identity-documents-table';
import { PatientChartSection } from './_chart/patient-chart-section';
import { PatientTimelineSection } from './_timeline/patient-timeline-section';
import { DeactivatePatientDialog } from './_modals/deactivate-patient-dialog';
import { DeletePatientDialog } from './_modals/delete-patient-dialog';

const PATIENT_TABS = ['overview', 'chart', 'timeline'] as const;

type PatientTab = (typeof PATIENT_TABS)[number];

function parsePatientTab(value: string | null): PatientTab {
  return PATIENT_TABS.includes(value as PatientTab) ? (value as PatientTab) : 'overview';
}

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

function PatientPhotoPreview({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Avatar className="size-20 rounded-md">
        {photoUrl ? (
          <AvatarImage src={photoUrl} alt="Patient photo" className="rounded-md" />
        ) : null}
        <AvatarFallback className="rounded-md">
          <UserRound className="text-muted-foreground size-7" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm font-medium">Patient photo</p>
        <p className="text-muted-foreground text-xs">
          {photoUrl ? 'From Emirates ID read' : 'Not captured'}
        </p>
      </div>
    </div>
  );
}

function getRegistrationStatusLabel(status: Patient['registrationStatus']) {
  return status === 'registered' ? 'Registered' : 'Provisional';
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading Patient">
      <div className="bg-card shadow-fluent-2 rounded-xl border p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      {[0, 1, 2, 3, 4, 5, 6].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          {section === 1 ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className={section === 0 ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]' : ''}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                {section === 0 ? (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                ) : null}
              </div>
              {section === 0 ? (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Skeleton className="size-20 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PatientDetailImpl({ patientId }: { patientId: number }) {
  const patientQuery = usePatientQuery(patientId);
  // The tab lives in the URL so that returning from a Timeline link lands back on
  // the Timeline rather than Overview, and so a view is shareable (ADR 0010).
  const [tabParam, setTabParam] = useQueryState('tab');
  const [patientPendingLifecycleChange, setPatientPendingLifecycleChange] =
    useState<Patient | null>(null);
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
              <Badge
                variant={patient.registrationStatus === 'registered' ? 'secondary' : 'outline'}
              >
                {getRegistrationStatusLabel(patient.registrationStatus)}
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
                onClick={() => setPatientPendingLifecycleChange(patient)}
              >
                <UserRoundX className="size-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPatientPendingLifecycleChange(patient)}
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

      <Tabs
        value={parsePatientTab(tabParam)}
        onValueChange={(value) => void setTabParam(value === 'overview' ? null : value)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle>Identifiers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailField label="Emirates ID" value={formatEmiratesId(patient.emiratesId)} />
                <DetailField
                  label="Patient Identification Category"
                  value={
                    patient.patientIdentificationCategory
                      ? getPatientIdentificationCategoryLabel(patient.patientIdentificationCategory)
                      : null
                  }
                />
                <DetailField label="UID" value={patient.uid} />
                <DetailField label="Nationality" value={patient.nationality?.name} />
                <DetailField label="Preferred language" value={patient.language?.name} />
                <DetailField label="Religion" value={patient.religion?.name} />
                <DetailField label="VIP" value={patient.isVip ? 'Yes' : 'No'} />
                <DetailField
                  label="Medical Tourist"
                  value={patient.isMedicalTourist ? 'Yes' : 'No'}
                />
                <DetailField
                  label="SMS Consent"
                  value={patient.smsConsent ? 'Enabled' : 'Disabled'}
                />
              </div>
              <PatientPhotoPreview photoUrl={patient.photoUrl} />
            </CardContent>
          </Card>

          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle>Identity documents</CardTitle>
            </CardHeader>
            <CardContent>
              <IdentityDocumentsTable documents={patient.identityDocuments} />
            </CardContent>
          </Card>

          <Card className="shadow-fluent-2">
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <DetailField
                label="Gender"
                value={patient.gender ? getPatientGenderLabel(patient.gender) : null}
              />
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
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <DetailField
                label="Preferred payment method"
                value={
                  patient.preferredPaymentMethod
                    ? getPatientPaymentMethodLabel(patient.preferredPaymentMethod)
                    : null
                }
              />
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
        </TabsContent>

        <TabsContent value="chart" className="mt-4">
          <PatientChartSection patientId={patient.id} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <PatientTimelineSection patientId={patient.id} />
        </TabsContent>
      </Tabs>

      <DeactivatePatientDialog
        patient={patientPendingLifecycleChange}
        onClose={() => setPatientPendingLifecycleChange(null)}
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
