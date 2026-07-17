'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Stethoscope,
  Table as TableIcon,
} from 'lucide-react';
import { useQueryState } from 'nuqs';

import type {
  Doctor,
  DoctorStatusFilter,
} from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorQuery } from '@/app/queries/doctors/useDoctor';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useSpecialtiesQuery } from '@/app/queries/specialties/useSpecialties';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DoctorStatusDialog } from './_modals/doctor-status-dialog';
import { DoctorFormSheet } from './_sheets/doctor-form-sheet';
import { DoctorViewSkeleton } from './doctor-skeletons';
import {
  DoctorCardView,
  DoctorListView,
  DoctorTableView,
  type DoctorStatusAction,
} from './doctor-views';

type ViewLayout = 'table' | 'card' | 'list';
type PendingDoctorStatusAction = {
  doctor: Doctor;
  action: DoctorStatusAction;
};

const PAGE_SIZE = 10;
const ALL_FILTER = 'all';

export function DoctorsPageImpl() {
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter | typeof ALL_FILTER>(
    ALL_FILTER
  );
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [pendingStatusAction, setPendingStatusAction] = useState<PendingDoctorStatusAction | null>(
    null
  );

  const isCreating = doctorParam === 'new';
  const editingDoctorId =
    doctorParam !== null && doctorParam !== 'new' && /^\d+$/.test(doctorParam)
      ? Number(doctorParam)
      : null;

  const specialtiesQuery = useSpecialtiesQuery({ limit: 999 });
  const doctorsQuery = useDoctorsQuery({
    query: debouncedSearch || undefined,
    status: statusFilter === ALL_FILTER ? undefined : statusFilter,
    specialtyId: specialtyFilter === ALL_FILTER ? undefined : Number(specialtyFilter),
    page,
    limit: PAGE_SIZE,
  });

  const doctors = doctorsQuery.data?.data ?? [];
  const specialties = specialtiesQuery.data?.data ?? [];
  const meta = doctorsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasFilters =
    Boolean(debouncedSearch) || statusFilter !== ALL_FILTER || specialtyFilter !== ALL_FILTER;

  const editingDoctorFromList =
    editingDoctorId !== null
      ? (doctors.find((doctor) => doctor.id === editingDoctorId) ?? null)
      : null;
  const shouldFetchEditingDoctor =
    editingDoctorId !== null && !doctorsQuery.isLoading && editingDoctorFromList === null;
  const editingDoctorQuery = useDoctorQuery(shouldFetchEditingDoctor ? editingDoctorId : null);
  const editingDoctor = editingDoctorFromList ?? editingDoctorQuery.data ?? null;
  const doctorResolving =
    editingDoctorId !== null &&
    editingDoctor === null &&
    (doctorsQuery.isLoading || editingDoctorQuery.isFetching);
  const sheetOpen =
    isCreating || (editingDoctorId !== null && (doctorResolving || editingDoctor !== null));

  const filterKey = `${debouncedSearch}|${statusFilter}|${specialtyFilter}`;
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <ToggleGroup
              type="single"
              value={viewLayout}
              onValueChange={(value) => {
                if (value) setViewLayout(value as ViewLayout);
              }}
              variant="outline"
              size="lg"
              spacing={0}
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-xs">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                placeholder="Search Doctors..."
                aria-label="Search Doctors"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </InputGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as DoctorStatusFilter | typeof ALL_FILTER)
              }
            >
              <SelectTrigger className="h-9 lg:w-40" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-9 lg:w-48" aria-label="Filter by Specialty">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All Specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={String(specialty.id)}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setDoctorParam('new')}>
                <Plus className="size-4" />
                Add Doctor
              </Button>
            </div>
          </CardContent>
        </Card>

        {specialtiesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Specialties</AlertTitle>
            <AlertDescription>{getApiErrorMessage(specialtiesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {doctorsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Doctors</AlertTitle>
            <AlertDescription>{getApiErrorMessage(doctorsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {doctorsQuery.isLoading ? (
          <DoctorViewSkeleton layout={viewLayout} />
        ) : doctors.length === 0 && !hasFilters ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Stethoscope />
              </EmptyMedia>
              <EmptyTitle>No Doctors yet</EmptyTitle>
              <EmptyDescription>
                Add Doctors in this Tenant so Doctor Schedules and Appointments can use them.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setDoctorParam('new')}>
                <Plus className="size-4" />
                Add Doctor
              </Button>
            </EmptyContent>
          </Empty>
        ) : doctors.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Doctors match the current search and filters. Try widening them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <DoctorTableView
                doctors={doctors}
                onEdit={(doctor) => void setDoctorParam(String(doctor.id))}
                onStatusAction={(doctor, action) => setPendingStatusAction({ doctor, action })}
              />
            ) : viewLayout === 'card' ? (
              <DoctorCardView
                doctors={doctors}
                onEdit={(doctor) => void setDoctorParam(String(doctor.id))}
                onStatusAction={(doctor, action) => setPendingStatusAction({ doctor, action })}
              />
            ) : (
              <DoctorListView
                doctors={doctors}
                onEdit={(doctor) => void setDoctorParam(String(doctor.id))}
                onStatusAction={(doctor, action) => setPendingStatusAction({ doctor, action })}
              />
            )}

            {totalPages > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  Showing {rangeStart}-{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <DoctorFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        doctorId={editingDoctorId}
        doctor={editingDoctor}
        isResolving={doctorResolving}
        onClose={() => void setDoctorParam(null)}
      />

      <DoctorStatusDialog
        pendingAction={pendingStatusAction}
        onClose={() => setPendingStatusAction(null)}
      />
    </>
  );
}
