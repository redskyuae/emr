'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, CalendarClock, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentStatusesQuery } from '@/app/queries/appointment-masters/statuses/useAppointmentStatuses';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
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
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toDateInputValue, toDisplayDate, todayDisplayDate } from '../_utils/appointment-date';
import { AppointmentsTable, AppointmentsTableSkeleton } from './appointments-table';

const PAGE_SIZE = 20;
const ALL_FILTER = 'all';

export function AppointmentsPageImpl() {
  const [dateParam, setDateParam] = useQueryState('date');
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [statusParam, setStatusParam] = useQueryState('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const slotDate = dateParam ?? todayDisplayDate();
  const doctorId = doctorParam && doctorParam !== ALL_FILTER ? Number(doctorParam) : undefined;
  const appointmentStatusId =
    statusParam && statusParam !== ALL_FILTER ? Number(statusParam) : undefined;

  const appointmentsQuery = useAppointmentsQuery({
    slotDate,
    doctorId,
    appointmentStatusId,
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const statusesQuery = useAppointmentStatusesQuery({ page: 1, limit: 999 });

  const appointments = appointmentsQuery.data?.data ?? [];
  const meta = appointmentsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <Input
            type="date"
            aria-label="Appointment date"
            className="h-9 lg:w-44"
            value={toDateInputValue(slotDate)}
            onChange={(event) => {
              setPage(1);
              void setDateParam(event.target.value ? toDisplayDate(event.target.value) : null);
            }}
          />

          <Select
            value={doctorParam ?? ALL_FILTER}
            onValueChange={(value) => {
              setPage(1);
              void setDoctorParam(value === ALL_FILTER ? null : value);
            }}
          >
            <SelectTrigger className="h-9 lg:w-52" aria-label="Filter by doctor">
              <SelectValue placeholder="All doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All doctors</SelectItem>
              {(doctorsQuery.data?.data ?? []).map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusParam ?? ALL_FILTER}
            onValueChange={(value) => {
              setPage(1);
              void setStatusParam(value === ALL_FILTER ? null : value);
            }}
          >
            <SelectTrigger className="h-9 lg:w-48" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
              {(statusesQuery.data?.data ?? []).map((status) => (
                <SelectItem key={status.id} value={String(status.id)}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-xs">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search booking, MRN, patient or doctor..."
              aria-label="Search appointments"
            />
          </InputGroup>

          <Button type="button" className="lg:ml-auto" asChild>
            <Link href="/appointments/new">
              <Plus className="size-4" />
              Book Appointment
            </Link>
          </Button>
        </CardContent>
      </Card>

      {appointmentsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Appointments</AlertTitle>
          <AlertDescription>{getApiErrorMessage(appointmentsQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      {appointmentsQuery.isLoading ? (
        <AppointmentsTableSkeleton />
      ) : appointments.length === 0 ? (
        <Empty className="bg-card shadow-fluent-2 min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>No Appointments for {slotDate}</EmptyTitle>
            <EmptyDescription>
              Book an Appointment to reserve consecutive DoctorSlots for a Patient.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" asChild>
              <Link href="/appointments/new">
                <Plus className="size-4" />
                Book Appointment
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <AppointmentsTable appointments={appointments} />

          {totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-muted-foreground text-sm">
                Showing {rangeStart}&ndash;{rangeEnd} of {total}
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
  );
}
