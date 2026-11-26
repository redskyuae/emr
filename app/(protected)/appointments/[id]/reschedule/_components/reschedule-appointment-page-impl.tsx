'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CiCalendarDate, CiCircleAlert } from 'react-icons/ci';
import {
  PiArrowLeftLight,
  PiArrowsClockwiseLight,
  PiBuildingsLight,
  PiLockKeyDuotone,
} from 'react-icons/pi';

import { AppointmentScheduleSection } from '@/app/(protected)/appointments/new/_components/appointment-schedule-section';
import { BookingSummary } from '@/app/(protected)/appointments/new/_components/booking-summary';
import { DoctorSelectionSection } from '@/app/(protected)/appointments/new/_components/doctor-selection-section';
import { ProcedureScheduleSection } from '@/app/(protected)/appointments/new/_components/procedure-schedule-section';
import { getDurationMinutes } from '@/app/(protected)/appointments/new/_utils/appointment-time';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RescheduleReason } from './reschedule-reason';
import { useRescheduleAppointmentForm } from './use-reschedule-appointment';

type RescheduleForm = ReturnType<typeof useRescheduleAppointmentForm>;
type RescheduleTarget = NonNullable<RescheduleForm['appointment']>;

export function RescheduleAppointmentPageImpl({ appointmentId }: { appointmentId: number }) {
  const { data: canReschedule, isLoading, isError } = useHasPermission('appointment:reschedule');

  if (isLoading) {
    return <RescheduleAppointmentSkeleton />;
  }

  if (isError && !canReschedule) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not check reschedule access</AlertTitle>
        <AlertDescription>Refresh the page and try again.</AlertDescription>
      </Alert>
    );
  }

  if (!canReschedule) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/appointments">
            <PiArrowLeftLight className="size-4" />
            Appointments
          </Link>
        </Button>
        <EmptyState
          tone="danger"
          orbit={false}
          className="min-h-72"
          icon={PiLockKeyDuotone}
          title="You don't have permission to reschedule Appointments."
          description="Contact a Tenant Admin if you need access."
        />
      </div>
    );
  }

  return <RescheduleAppointmentContent appointmentId={appointmentId} />;
}

// Mounted only with `appointment:reschedule`, so the Appointment is never requested without it.
function RescheduleAppointmentContent({ appointmentId }: { appointmentId: number }) {
  const reschedule = useRescheduleAppointmentForm(appointmentId);
  const { appointment } = reschedule;

  if (!reschedule.isLoading && (reschedule.error || !appointment)) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load Appointment</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{getApiErrorMessage(reschedule.error)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => reschedule.retryAppointment()}
          >
            <PiArrowsClockwiseLight className="size-4" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // The direct-child flex classes let the form keep filling the page, so its sticky footer
  // still sits at the bottom of a short page.
  return (
    <SkeletonCrossfade
      isLoading={reschedule.isLoading}
      skeleton={<RescheduleAppointmentSkeleton />}
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col *:flex *:flex-1 *:flex-col"
    >
      {!appointment ? null : reschedule.isEligible ? (
        <RescheduleAppointmentForm reschedule={reschedule} appointment={appointment} />
      ) : (
        <IneligibleAppointment appointment={appointment} />
      )}
    </SkeletonCrossfade>
  );
}

function getReturnHref(appointment: RescheduleTarget) {
  return `/appointments?date=${encodeURIComponent(appointment.slotDate)}&appointment=${appointment.id}`;
}

function IneligibleAppointment({ appointment }: { appointment: RescheduleTarget }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild>
        <Link href={getReturnHref(appointment)}>
          <PiArrowLeftLight className="size-4" /> Back to Appointments
        </Link>
      </Button>
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Appointment cannot be rescheduled</AlertTitle>
        <AlertDescription>
          Only Scheduled or Confirmed Appointments can be rescheduled. This Appointment is{' '}
          {appointment.appointmentStatus.name}.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function RescheduleAppointmentForm({
  reschedule,
  appointment,
}: {
  reschedule: RescheduleForm;
  appointment: RescheduleTarget;
}) {
  const { form, values } = reschedule;
  const returnHref = getReturnHref(appointment);

  const currentTime =
    appointment.startTime && appointment.endTime
      ? `${appointment.startTime}–${appointment.endTime}`
      : appointment.slots.map((slot) => slot.slotTime).join(', ');
  const recommendedDuration =
    getDurationMinutes(appointment.startTime ?? '', appointment.endTime ?? '') || 15;

  return (
    <form onSubmit={reschedule.onSubmit} className="flex flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href={returnHref}>
              <PiArrowLeftLight className="size-4" /> Back to Appointments
            </Link>
          </Button>
          <p className="text-muted-foreground text-sm">
            Change the schedule for <span className="font-mono">{appointment.bookingNumber}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <PiBuildingsLight className="text-primary size-4 shrink-0" />
          <div>
            <p className="font-medium">{reschedule.tenant?.name ?? 'Current Tenant'}</p>
            <p className="text-muted-foreground text-xs">Times use the Tenant time zone</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>
                {appointment.patient.firstName} {appointment.patient.lastName}
              </CardTitle>
              <CardDescription>
                MRN {appointment.patient.mrn} · {appointment.patient.phone}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{appointment.appointmentStatus.name}</Badge>
              <Badge variant="outline">{appointment.bookingPath}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Current date</p>
            <p className="font-medium">{appointment.slotDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current time</p>
            <p className="font-mono text-xs font-medium">{currentTime || 'Not recorded'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current Doctor</p>
            <p className="font-medium">{appointment.doctor?.name ?? 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {reschedule.submitError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not reschedule Appointment</AlertTitle>
          <AlertDescription>{reschedule.submitError}</AlertDescription>
        </Alert>
      ) : null}

      {reschedule.isProcedure ? (
        <ProcedureScheduleSection
          control={form.control}
          startTime={values.startTime}
          endTime={values.endTime}
          usesSessionDuration={false}
          timeZoneLabel="the Tenant time zone"
          onDateChange={reschedule.changeProcedureDate}
          onStartTimeChange={reschedule.changeProcedureStartTime}
          onEndTimeChange={reschedule.changeProcedureEndTime}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
          <DoctorSelectionSection
            control={form.control}
            doctors={reschedule.doctors}
            onChange={reschedule.changeDoctor}
          />
          <AppointmentScheduleSection
            control={form.control}
            rotas={reschedule.rotas}
            rota={reschedule.selectedRota}
            doctorId={values.doctorId}
            slotDate={values.slotDate}
            startTime={values.startTime}
            endTime={values.endTime}
            selectedRotaId={values.doctorRotaId}
            recommendedDuration={recommendedDuration}
            timeZoneLabel="the Tenant time zone"
            isLoading={reschedule.isDoctorSlotsLoading}
            error={reschedule.doctorSlotsError}
            canViewDoctorSlots={reschedule.canViewDoctorSlots}
            onRetry={() => void reschedule.retryDoctorSlots()}
            onContextChange={reschedule.changeScheduleContext}
            onRotaChange={reschedule.changeRota}
            onTimeChange={reschedule.changeTime}
          />
        </div>
      )}

      <RescheduleReason control={form.control} />

      <footer className="bg-card sticky bottom-0 z-20 mt-auto flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:p-4">
        <CiCalendarDate className="text-primary hidden size-5 sm:block" />
        <BookingSummary
          values={values}
          room={null}
          therapist={null}
          showProcedureResources={false}
          doctorName={
            reschedule.isProcedure
              ? (appointment.doctor?.name ?? 'N/A')
              : (reschedule.selectedDoctor?.name ?? '')
          }
        />
        <Button
          type="submit"
          className="ml-auto"
          disabled={reschedule.mutation.isPending}
          aria-busy={reschedule.mutation.isPending}
        >
          <CiCalendarDate className="size-4" />
          {reschedule.mutation.isPending ? 'Rescheduling…' : 'Reschedule Appointment'}
        </Button>
      </footer>
    </form>
  );
}

// Mirrors the form: the header (back link, booking line and Tenant), the Patient card with
// its badges and current schedule, the Doctor and schedule columns, the reason card and the
// sticky footer. A Procedure reschedules in one schedule card, but the Booking Path is not
// known until the Appointment loads, so the Consultation layout stands in.
function RescheduleAppointmentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4" aria-label="Loading Reschedule Appointment">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <RescheduleTenantSkeleton />
      </div>
      <RescheduleAppointmentBodySkeleton />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// The booking section card: an icon chip, the real title and a description line over its body.
function SectionCardSkeleton({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="w-full space-y-1.5">
            <CardTitle>{title}</CardTitle>
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function RescheduleTenantSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-4 shrink-0 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function RescheduleAppointmentBodySkeleton() {
  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {['Current date', 'Current time', 'Current Doctor'].map((label) => (
            <div key={label} className="space-y-1">
              <p className="text-muted-foreground text-xs">{label}</p>
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <SectionCardSkeleton title="Doctor">
          <FieldSkeleton />
        </SectionCardSkeleton>
        <SectionCardSkeleton title="Date & time">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="bg-muted/25 space-y-4 rounded-xl border p-3 sm:p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {Array.from({ length: 12 }, (_, slot) => (
                  <Skeleton key={slot} className="h-8 w-full" />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </div>
          </div>
        </SectionCardSkeleton>
      </div>

      <SectionCardSkeleton title="Rescheduling reason">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full" />
        </div>
      </SectionCardSkeleton>

      <div className="bg-card mt-auto flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:p-4">
        <Skeleton className="hidden size-5 rounded-full sm:block" />
        <Skeleton className="h-4 w-60 max-w-full" />
        <Skeleton className="ml-auto h-9 w-48" />
      </div>
    </>
  );
}
