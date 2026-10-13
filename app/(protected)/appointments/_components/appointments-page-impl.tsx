'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, CalendarClock, CalendarDays, Plus } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentStatusesQuery } from '@/app/queries/appointment-masters/statuses/useAppointmentStatuses';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { todayDisplayDate, tomorrowDisplayDate } from '../_utils/appointment-date';
import { AppointmentDaySection, AppointmentDaySectionSkeleton } from './appointment-day-section';
import { AppointmentsTabToolbar } from './appointments-tab-toolbar';
import { CancelAppointmentDialog } from './_modals/cancel-appointment-dialog';
import { AppointmentDetailSheet } from './_sheets/appointment-detail-sheet';

const PAGE_SIZE = 3;
const TODAY_STATUS_CATEGORIES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'] as const;
const UPCOMING_STATUS_CATEGORIES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'] as const;

export function AppointmentsPageImpl() {
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [therapistParam, setTherapistParam] = useQueryState('therapist');
  const [statusParam, setStatusParam] = useQueryState('status');
  const [viewParam, setViewParam] = useQueryState('view');
  const [todayPageParam, setTodayPage] = useQueryState('todayPage', parseAsInteger.withDefault(1));
  const [upcomingPageParam, setUpcomingPage] = useQueryState(
    'upcomingPage',
    parseAsInteger.withDefault(1)
  );
  // Deep-link target for Booking entries on the Patient Timeline (ADR 0010).
  const [appointmentParam, setAppointmentParam] = useQueryState('appointment');
  const [cancelParam, setCancelParam] = useQueryState('cancel');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });

  const { data: canCreate } = useHasPermission('appointment:create');

  const todayDate = todayDisplayDate();
  const tomorrowDate = tomorrowDisplayDate();
  const todayPage = Number.isInteger(todayPageParam) && todayPageParam > 0 ? todayPageParam : 1;
  const upcomingPage =
    Number.isInteger(upcomingPageParam) && upcomingPageParam > 0 ? upcomingPageParam : 1;
  const activeView = viewParam === 'upcoming' ? 'upcoming' : 'today';
  const doctorId = doctorParam ? Number(doctorParam) : undefined;
  const therapistId = therapistParam ? Number(therapistParam) : undefined;
  const appointmentStatusId = statusParam ? Number(statusParam) : undefined;
  const selectedAppointmentId =
    appointmentParam && /^\d+$/.test(appointmentParam) ? Number(appointmentParam) : null;

  const sharedFilters = {
    doctorId,
    therapistId,
    appointmentStatusId,
    query: debouncedSearch || undefined,
  };
  const todayAppointmentsQuery = useAppointmentsQuery({
    ...sharedFilters,
    slotDate: todayDate,
    page: todayPage,
    limit: PAGE_SIZE,
    statusCategories: [...TODAY_STATUS_CATEGORIES],
  });
  const upcomingAppointmentsQuery = useAppointmentsQuery({
    ...sharedFilters,
    fromDate: tomorrowDate,
    page: upcomingPage,
    limit: PAGE_SIZE,
    statusCategories: [...UPCOMING_STATUS_CATEGORIES],
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const therapistsQuery = useTherapistsQuery({ page: 1, limit: 999 });
  const statusesQuery = useAppointmentStatusesQuery({ page: 1, limit: 999 });

  const todayAppointments = todayAppointmentsQuery.data?.data ?? [];
  const upcomingAppointments = upcomingAppointmentsQuery.data?.data ?? [];
  const appointments = [...todayAppointments, ...upcomingAppointments];
  const todayMeta = todayAppointmentsQuery.data?.meta;
  const upcomingMeta = upcomingAppointmentsQuery.data?.meta;
  const cancellingAppointmentId =
    cancelParam && /^\d+$/.test(cancelParam) ? Number(cancelParam) : null;
  const cancellingAppointment =
    appointments.find((appointment) => appointment.id === cancellingAppointmentId) ?? null;

  useEffect(() => {
    const lastPage = Math.max(1, todayMeta?.totalPages ?? 1);

    if (todayPageParam !== todayPage) {
      void setTodayPage(todayPage);
    } else if (todayPage > lastPage) {
      void setTodayPage(lastPage);
    }
  }, [setTodayPage, todayMeta?.totalPages, todayPage, todayPageParam]);

  useEffect(() => {
    const lastPage = Math.max(1, upcomingMeta?.totalPages ?? 1);

    if (upcomingPageParam !== upcomingPage) {
      void setUpcomingPage(upcomingPage);
    } else if (upcomingPage > lastPage) {
      void setUpcomingPage(lastPage);
    }
  }, [setUpcomingPage, upcomingMeta?.totalPages, upcomingPage, upcomingPageParam]);

  function resetPages() {
    void setTodayPage(1);
    void setUpcomingPage(1);
  }

  const toolbarDisabled =
    doctorsQuery.isLoading || therapistsQuery.isLoading || statusesQuery.isLoading;

  const toolbarProps = {
    appointmentStatusId: statusParam,
    appointmentStatuses: statusesQuery.data?.data ?? [],
    doctorId: doctorParam,
    doctors: doctorsQuery.data?.data ?? [],
    onAppointmentStatusChange: (value: string | null) => {
      void setStatusParam(value);
      resetPages();
    },
    onDoctorChange: (value: string | null) => {
      void setDoctorParam(value);
      resetPages();
    },
    onSearchChange: (value: string) => {
      setSearchTerm(value);
      resetPages();
    },
    onTherapistChange: (value: string | null) => {
      void setTherapistParam(value);
      resetPages();
    },
    searchTerm,
    therapistId: therapistParam,
    therapists: therapistsQuery.data?.data ?? [],
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeView}
        onValueChange={(value) => void setViewParam(value === 'upcoming' ? value : null)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="Appointment schedule views">
            <TabsTrigger value="today" className="px-3">
              <CalendarDays className="size-4" aria-hidden="true" />
              Today&apos;s Appointments
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="px-3">
              <CalendarClock className="size-4" aria-hidden="true" />
              Upcoming Appointments
            </TabsTrigger>
          </TabsList>

          {canCreate ? (
            <Button type="button" asChild>
              <Link href="/appointments/new">
                <Plus className="size-4" />
                Book Appointment
              </Link>
            </Button>
          ) : null}
        </div>

        <TabsContent value="today" className="space-y-4">
          <AppointmentsTabToolbar
            {...toolbarProps}
            exportFilters={{
              slotDate: todayDate,
              doctorId,
              therapistId,
              appointmentStatusId,
              query: debouncedSearch || undefined,
              statusCategories: [...TODAY_STATUS_CATEGORIES],
            }}
            hasAppointments={(todayMeta?.total ?? 0) > 0}
            disabled={
              toolbarDisabled ||
              todayAppointmentsQuery.isLoading ||
              todayAppointmentsQuery.isFetching
            }
          />

          {todayAppointmentsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Could not load Today&apos;s Appointments</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(todayAppointmentsQuery.error)}
              </AlertDescription>
            </Alert>
          ) : todayAppointmentsQuery.isLoading ? (
            <AppointmentDaySectionSkeleton />
          ) : (
            <AppointmentDaySection
              id="today-appointments"
              kind="today"
              title="Today's Appointments"
              appointments={todayAppointments}
              total={todayMeta?.total ?? 0}
              totalPages={todayMeta?.totalPages ?? 0}
              page={todayPage}
              pageSize={PAGE_SIZE}
              isFetching={todayAppointmentsQuery.isFetching}
              description={`Appointments scheduled for today, ${todayDate}.`}
              emptyDescription="No Appointments scheduled for today match the current filters."
              onPageChange={(page) => void setTodayPage(page)}
              onCancel={(appointment) => void setCancelParam(String(appointment.id))}
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <AppointmentsTabToolbar
            {...toolbarProps}
            exportFilters={{
              fromDate: tomorrowDate,
              doctorId,
              therapistId,
              appointmentStatusId,
              query: debouncedSearch || undefined,
              statusCategories: [...UPCOMING_STATUS_CATEGORIES],
            }}
            hasAppointments={(upcomingMeta?.total ?? 0) > 0}
            disabled={
              toolbarDisabled ||
              upcomingAppointmentsQuery.isLoading ||
              upcomingAppointmentsQuery.isFetching
            }
          />

          {upcomingAppointmentsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Could not load Upcoming Appointments</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(upcomingAppointmentsQuery.error)}
              </AlertDescription>
            </Alert>
          ) : upcomingAppointmentsQuery.isLoading ? (
            <AppointmentDaySectionSkeleton />
          ) : (
            <AppointmentDaySection
              id="upcoming-appointments"
              kind="upcoming"
              title="Upcoming Appointments"
              appointments={upcomingAppointments}
              total={upcomingMeta?.total ?? 0}
              totalPages={upcomingMeta?.totalPages ?? 0}
              page={upcomingPage}
              pageSize={PAGE_SIZE}
              isFetching={upcomingAppointmentsQuery.isFetching}
              description={`Future Appointments from ${tomorrowDate} onward.`}
              emptyDescription="No future Appointments match the current filters."
              onPageChange={(page) => void setUpcomingPage(page)}
              onCancel={(appointment) => void setCancelParam(String(appointment.id))}
            />
          )}
        </TabsContent>
      </Tabs>

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
