'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryState } from 'nuqs';
import {
  CiEdit,
  CiGrid41,
  CiMedicalClipboard,
  CiMenuKebab,
  CiTrash,
  CiUser,
  CiViewTimeline,
  CiWavePulse1,
} from 'react-icons/ci';
import {
  PiArrowLeftLight,
  PiUserCheckLight,
  PiUserMinusLight,
  PiUserMinusDuotone,
} from 'react-icons/pi';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import {
  formatEmiratesId,
  getPatientGenderLabel,
  getPatientEthnicGroupLabel,
  getPatientIdentificationCategoryLabel,
  getPatientMaritalStatusLabel,
  getPatientPaymentMethodLabel,
  getPatientRaceLabel,
  getPatientTitleLabel,
} from '@/app/(protected)/patients/_utils/patient-value-sets';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { IdentityDocumentsTable, IdentityDocumentsTableSkeleton } from './identity-documents-table';
import { ChartSkeleton, PatientChartSection } from './_chart/patient-chart-section';
import { PatientTimelineSection, TimelineSkeleton } from './_timeline/patient-timeline-section';
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
          <CiUser className="text-muted-foreground size-7" aria-hidden="true" />
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

function DetailFieldSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-32" />
    </div>
  );
}

function DetailFieldsSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }, (_, field) => <DetailFieldSkeleton key={field} />);
}

// Mirrors the loaded page below the back link: the header card with its badges and the
// actions the user may take, the tab track, then the current tab's own skeleton. The
// Overview cards keep their real titles, grids and field counts.
export function PatientDetailSkeleton({
  tab = 'overview',
  canUpdate = true,
  canToggleActive = true,
  canDelete = false,
}: {
  tab?: PatientTab;
  canUpdate?: boolean;
  canToggleActive?: boolean;
  canDelete?: boolean;
}) {
  return (
    <div className="space-y-4" aria-label="Loading Patient">
      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-2">
            {canUpdate ? <Skeleton className="h-9 w-20" /> : null}
            {canToggleActive ? <Skeleton className="h-9 w-28" /> : null}
            {canDelete ? <Skeleton className="size-9" /> : null}
          </div>
        </CardContent>
      </Card>

      {/* The same column and gap as Tabs, so the tab body starts where it will land. */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-80 max-w-full rounded-full" />

        {tab === 'chart' ? (
          <div className="mt-4">
            <ChartSkeleton />
          </div>
        ) : tab === 'timeline' ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <TimelineSkeleton />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="grid gap-4 sm:grid-cols-3">
                  <DetailFieldsSkeleton count={12} />
                </div>
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <Skeleton className="size-20 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Identity documents</CardTitle>
              </CardHeader>
              <CardContent>
                <IdentityDocumentsTableSkeleton />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <DetailFieldsSkeleton count={5} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <DetailFieldsSkeleton count={3} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailFieldsSkeleton count={6} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <DetailFieldsSkeleton count={1} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next of Kin</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailFieldsSkeleton count={4} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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

  const { data: canUpdate } = useHasPermission('patient:update');
  const { data: canDeactivate } = useHasPermission('patient:deactivate');
  const { data: canReactivate } = useHasPermission('patient:reactivate');
  const { data: canDelete } = useHasPermission('patient:delete');
  const { data: canViewAudit } = useHasPermission('audit-log:read');

  const tab = parsePatientTab(tabParam);
  const shownTab = patientQuery.data ? `${patientId}|${tab}` : null;
  const recordedTab = useRef<string | null>(null);

  // Each tab as it is shown, the first one included. The Patient is never part of the event.
  useEffect(() => {
    if (!shownTab || recordedTab.current === shownTab) {
      return;
    }

    recordedTab.current = shownTab;
    captureAnalyticsEvent('patient_detail_tab_viewed', { tab });
  }, [shownTab, tab]);

  if (patientQuery.isError || (!patientQuery.isLoading && !patientQuery.data)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          tone="danger"
          orbit={false}
          className="min-h-72"
          title="Patient not found"
          icon={PiUserMinusDuotone}
          description={getApiErrorMessage(patientQuery.error)}
        />
      </div>
    );
  }

  const patient = patientQuery.data;
  const canToggleActive = patient?.isActive ? canDeactivate : canReactivate;

  return (
    <div className="space-y-4">
      <BackLink />

      <SkeletonCrossfade
        isLoading={patientQuery.isLoading}
        skeleton={
          <PatientDetailSkeleton
            tab={tab}
            canUpdate={Boolean(canUpdate)}
            canToggleActive={Boolean(canDeactivate || canReactivate)}
            canDelete={Boolean(canDelete)}
          />
        }
      >
        {patient ? (
          <div className="space-y-4">
            <Card>
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
                      variant={
                        patient.registrationStatus === 'registered' ? 'secondary' : 'outline'
                      }
                    >
                      {getRegistrationStatusLabel(patient.registrationStatus)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-mono text-sm">MRN {patient.mrn}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canUpdate ? (
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/patients/${patient.id}/edit`}>
                        <CiEdit className="size-4" />
                        Edit
                      </Link>
                    </Button>
                  ) : null}

                  {canToggleActive ? (
                    patient.isActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPatientPendingLifecycleChange(patient)}
                      >
                        <PiUserMinusLight className="size-4" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPatientPendingLifecycleChange(patient)}
                      >
                        <PiUserCheckLight className="size-4" />
                        Reactivate
                      </Button>
                    )
                  ) : null}

                  {canDelete || canViewAudit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="More actions">
                          <CiMenuKebab className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {canViewAudit ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/audit-log?patient=${patient.id}`}>
                              <CiWavePulse1 className="size-4" />
                              Audit history
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setPatientPendingDelete(patient)}
                          >
                            <CiTrash className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Tabs
              value={tab}
              onValueChange={(value) => void setTabParam(value === 'overview' ? null : value)}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="overview">
                  <CiGrid41 aria-hidden="true" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <CiMedicalClipboard aria-hidden="true" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <CiViewTimeline aria-hidden="true" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identifiers</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <DetailField
                        label="Emirates ID"
                        value={formatEmiratesId(patient.emiratesId)}
                      />
                      <DetailField
                        label="Patient Identification Category"
                        value={
                          patient.patientIdentificationCategory
                            ? getPatientIdentificationCategoryLabel(
                                patient.patientIdentificationCategory
                              )
                            : null
                        }
                      />
                      <DetailField label="UID" value={patient.uid} />
                      <DetailField label="Passport number" value={patient.passportNumber} />
                      <DetailField label="Nationality" value={patient.nationality?.name} />
                      <DetailField label="Preferred language" value={patient.language?.name} />
                      <DetailField label="Religion" value={patient.religion?.name} />
                      <DetailField
                        label="Race"
                        value={patient.race ? getPatientRaceLabel(patient.race) : null}
                      />
                      <DetailField
                        label="Ethnic Group"
                        value={
                          patient.ethnicGroup
                            ? getPatientEthnicGroupLabel(patient.ethnicGroup)
                            : null
                        }
                      />
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

                <Card>
                  <CardHeader>
                    <CardTitle>Identity documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IdentityDocumentsTable documents={patient.identityDocuments} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <DetailField
                      label="Title"
                      value={patient.title ? getPatientTitleLabel(patient.title) : null}
                    />
                    <DetailField
                      label="Gender"
                      value={patient.gender ? getPatientGenderLabel(patient.gender) : null}
                    />
                    <DetailField label="Date of birth" value={patient.dateOfBirth} />
                    <DetailField label="Blood group" value={patient.bloodGroup} />
                    <DetailField
                      label="Marital status"
                      value={
                        patient.maritalStatus
                          ? getPatientMaritalStatusLabel(patient.maritalStatus)
                          : null
                      }
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <DetailField label="Phone" value={patient.phone} />
                    <DetailField label="Alternate phone" value={patient.alternatePhone} />
                    <DetailField label="Email" value={patient.email} />
                  </CardContent>
                </Card>

                <Card>
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

                <Card>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Next of Kin</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField label="Next of Kin" value={patient.emergencyContactName} />
                    <DetailField
                      label="Next of Kin Relationship"
                      value={patient.emergencyContactRelationship}
                    />
                    <DetailField
                      label="Next of Kin Gender"
                      value={
                        patient.emergencyContactGender
                          ? getPatientGenderLabel(patient.emergencyContactGender)
                          : null
                      }
                    />
                    <DetailField label="Next of Kin Phone" value={patient.emergencyContactPhone} />
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
              patient={canToggleActive ? patientPendingLifecycleChange : null}
              onClose={() => setPatientPendingLifecycleChange(null)}
            />
            <DeletePatientDialog
              patient={canDelete ? patientPendingDelete : null}
              onClose={() => setPatientPendingDelete(null)}
            />
          </div>
        ) : null}
      </SkeletonCrossfade>
    </div>
  );
}

function BackLink() {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/patients">
        <PiArrowLeftLight className="size-4" />
        Patients
      </Link>
    </Button>
  );
}
