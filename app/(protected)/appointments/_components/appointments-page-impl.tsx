'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, Plus, Search } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentStatusesQuery } from '@/app/queries/appointment-masters/statuses/useAppointmentStatuses';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { brandLogos } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { partitionAppointmentsByDayView } from '../_utils/appointment-groups';
import { AppointmentDaySection, AppointmentDaySectionSkeleton } from './appointment-day-section';
import { AppointmentExportActions } from './appointment-export-actions';
import { CancelAppointmentDialog } from './_modals/cancel-appointment-dialog';
import { AppointmentDetailSheet } from './_sheets/appointment-detail-sheet';

const DAY_VIEW_LIMIT = 999;
const ALL_FILTER = 'all';

export function AppointmentsPageImpl() {
  const [dateParam, setDateParam] = useQueryState('date');
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [therapistParam, setTherapistParam] = useQueryState('therapist');
  const [statusParam, setStatusParam] = useQueryState('status');
  // Deep-link target for Booking entries on the Patient Timeline (ADR 0010).
  const [appointmentParam, setAppointmentParam] = useQueryState('appointment');
  const [cancelParam, setCancelParam] = useQueryState('cancel');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });

  const { data: canCreate } = useHasPermission('appointment:create');
  const brandVariant = useBrandLogoVariant();
  const brand = brandVariant === 'none' ? null : brandLogos[brandVariant];

  const slotDate = dateParam ?? todayDisplayDate();
  const doctorId = doctorParam && doctorParam !== ALL_FILTER ? Number(doctorParam) : undefined;
  const therapistId =
    therapistParam && therapistParam !== ALL_FILTER ? Number(therapistParam) : undefined;
  const appointmentStatusId =
    statusParam && statusParam !== ALL_FILTER ? Number(statusParam) : undefined;
  const selectedAppointmentId =
    appointmentParam && /^\d+$/.test(appointmentParam) ? Number(appointmentParam) : null;

  const appointmentsQuery = useAppointmentsQuery({
    slotDate,
    doctorId,
    therapistId,
    appointmentStatusId,
    query: debouncedSearch || undefined,
    limit: DAY_VIEW_LIMIT,
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const therapistsQuery = useTherapistsQuery({ page: 1, limit: 999 });
  const statusesQuery = useAppointmentStatusesQuery({ page: 1, limit: 999 });

  const appointments = appointmentsQuery.data?.data ?? [];
  const cancellingAppointmentId =
    cancelParam && /^\d+$/.test(cancelParam) ? Number(cancelParam) : null;
  const cancellingAppointment =
    appointments.find((appointment) => appointment.id === cancellingAppointmentId) ?? null;
  const { upcoming, completed } = partitionAppointmentsByDayView(appointments);

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:flex-wrap lg:items-center">
          <Input
            type="date"
            aria-label="Appointment date"
            className="h-9 lg:w-44"
            value={toDateInputValue(slotDate)}
            onChange={(event) => {
              void setDateParam(event.target.value ? toDisplayDate(event.target.value) : null);
            }}
          />

          <Select
            value={doctorParam ?? ALL_FILTER}
            onValueChange={(value) => {
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
            value={therapistParam ?? ALL_FILTER}
            onValueChange={(value) => {
              void setTherapistParam(value === ALL_FILTER ? null : value);
            }}
          >
            <SelectTrigger className="h-9 lg:w-52" aria-label="Filter by Therapist">
              <SelectValue placeholder="All Therapists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All Therapists</SelectItem>
              {(therapistsQuery.data?.data ?? []).map((therapist) => (
                <SelectItem key={therapist.id} value={String(therapist.id)}>
                  {therapist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusParam ?? ALL_FILTER}
            onValueChange={(value) => {
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
              }}
              placeholder="Search booking, MRN, patient or doctor..."
              aria-label="Search appointments"
            />
          </InputGroup>

          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <AppointmentExportActions
              appointments={appointments}
              slotDate={slotDate}
              logoUrl={brand?.markSrc ?? null}
              organizationName={brand?.name ?? 'Medical EMR'}
              organizationSubtitle={brand?.subtitle ?? 'Electronic Medical Record'}
              disabled={
                appointmentsQuery.isLoading ||
                appointmentsQuery.isFetching ||
                doctorsQuery.isLoading ||
                therapistsQuery.isLoading ||
                statusesQuery.isLoading
              }
            />
            {canCreate ? (
              <Button type="button" className="flex-1 sm:flex-none" asChild>
                <Link href="/appointments/new">
                  <Plus className="size-4" />
                  Book Appointment
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {appointmentsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Appointments</AlertTitle>
          <AlertDescription>{getApiErrorMessage(appointmentsQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      {!appointmentsQuery.isError ? (
        appointmentsQuery.isLoading ? (
          <div className="space-y-6">
            <AppointmentDaySectionSkeleton />
            <AppointmentDaySectionSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            <AppointmentDaySection
              id="upcoming-appointments"
              kind="upcoming"
              title="Upcoming Appointments"
              appointments={upcoming}
              description={`Scheduled, confirmed, and checked-in Appointments for ${slotDate}.`}
              emptyDescription="No upcoming Appointments match the current filters."
              onCancel={(appointment) => void setCancelParam(String(appointment.id))}
            />
            <AppointmentDaySection
              id="completed-appointments"
              kind="completed"
              title="Completed Appointments"
              appointments={completed}
              description={`Appointments completed on ${slotDate}.`}
              emptyDescription="No completed Appointments match the current filters."
              onCancel={(appointment) => void setCancelParam(String(appointment.id))}
            />
          </div>
        )
      ) : null}

      <AppointmentDetailSheet
        appointmentId={selectedAppointmentId}
        onClose={() => void setAppointmentParam(null)}
      />
      {cancellingAppointment ? (
        <CancelAppointmentDialog
          appointment={cancellingAppointment}
          onClose={() => void setCancelParam(null)}
        />
      ) : null}
    </div>
  );
}
