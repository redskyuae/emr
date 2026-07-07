'use client';

import Link from 'next/link';
import { AlertCircle, UsersRound } from 'lucide-react';

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

function getPatientAge(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
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
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Patients</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        {isLoading ? (
          <PatientsTableSkeleton />
        ) : patients.length === 0 ? (
          <Empty className="min-h-72 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound className="size-5" />
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
                  <TableHead>Date of birth</TableHead>
                  <TableHead>Phone</TableHead>
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
                    <TableCell>{getPatientGenderLabel(patient.gender)}</TableCell>
                    <TableCell>
                      {patient.dateOfBirth}{' '}
                      <span className="text-muted-foreground">
                        ({getPatientAge(patient.dateOfBirth)}y)
                      </span>
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
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
