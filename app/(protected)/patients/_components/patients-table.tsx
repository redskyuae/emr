'use client';

import Link from 'next/link';
import type { IconType } from 'react-icons';
import { CiCircleAlert, CiPhone } from 'react-icons/ci';
import { PiGenderFemaleLight, PiGenderMaleLight, PiUsersLight } from 'react-icons/pi';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { getPatientGenderLabel } from '@/app/(protected)/patients/_utils/patient-value-sets';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type PatientsTableProps = {
  patients: Patient[];
  meta: Paginated<Patient>['meta'] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  page: number;
  onPageChange: (next: number) => void;
};

function getPatientFullName(patient: Patient) {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

function parseDateOfBirth(dateOfBirth: string) {
  // Parse the YYYY-MM-DD parts as a local date so the day never shifts with the time zone.
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getPatientAge(birthDate: Date) {
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

const GENDER_ICONS: Partial<
  Record<NonNullable<Patient['gender']>, { icon: IconType; className: string }>
> = {
  male: { icon: PiGenderMaleLight, className: 'text-gender-male' },
  female: { icon: PiGenderFemaleLight, className: 'text-gender-female' },
};

function PatientGenderCell({ gender }: { gender: Patient['gender'] }) {
  if (!gender) {
    return <span className="text-muted-foreground">Not provided</span>;
  }

  const genderIcon = GENDER_ICONS[gender];
  const Icon = genderIcon?.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon ? <Icon aria-hidden className={cn('size-4.5 shrink-0', genderIcon.className)} /> : null}
      {getPatientGenderLabel(gender)}
    </span>
  );
}

function PatientAgeCell({ dateOfBirth }: { dateOfBirth: Patient['dateOfBirth'] }) {
  if (!dateOfBirth) {
    return <span className="text-muted-foreground">Not provided</span>;
  }

  const birthDate = parseDateOfBirth(dateOfBirth);
  const age = getPatientAge(birthDate);
  const formattedDateOfBirth = birthDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // The date of birth identifies a Patient, so it stays in view beside the age, never behind a hover.
  return (
    <span className="inline-flex items-baseline gap-2">
      {age} {age === 1 ? 'year' : 'years'}
      <span className="text-muted-foreground text-xs">
        <span className="sr-only">Date of birth </span>
        {formattedDateOfBirth}
      </span>
    </span>
  );
}

export function PatientsTable({
  patients,
  meta,
  isLoading,
  isFetching,
  isError,
  error,
  page,
  onPageChange,
}: PatientsTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load Patients</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        {isLoading ? (
          <PatientsTableSkeleton />
        ) : patients.length === 0 ? (
          <Empty className="min-h-72 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PiUsersLight className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Patients found.</EmptyTitle>
              <EmptyDescription>
                Try a different search term or filter — or register a new Patient.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table className={cn('min-w-max', isFetching && 'opacity-70 transition-opacity')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">MRN</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age / Date of birth</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="hover:text-primary font-mono text-sm hover:underline"
                      >
                        {patient.mrn}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/patients/${patient.id}`} className="hover:underline">
                        {getPatientFullName(patient)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PatientGenderCell gender={patient.gender} />
                    </TableCell>
                    <TableCell>
                      <PatientAgeCell dateOfBirth={patient.dateOfBirth} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <CiPhone aria-hidden className="text-phone size-4.5 shrink-0" />
                        {patient.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          patient.registrationStatus === 'registered' ? 'secondary' : 'outline'
                        }
                      >
                        {patient.registrationStatus === 'registered' ? 'Registered' : 'Provisional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
              <p className="text-muted-foreground text-sm">
                {total} {total === 1 ? 'Patient' : 'Patients'}
                {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
              </p>
              {totalPages > 1 ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PatientsTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-10 w-full" />
      ))}
    </div>
  );
}
