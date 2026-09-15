'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Building2, CalendarClock, RefreshCw } from 'lucide-react';

import { AppointmentScheduleSection } from '@/app/(protected)/appointments/new/_components/appointment-schedule-section';
import { BookingSummary } from '@/app/(protected)/appointments/new/_components/booking-summary';
import { DoctorSelectionSection } from '@/app/(protected)/appointments/new/_components/doctor-selection-section';
import { ProcedureScheduleSection } from '@/app/(protected)/appointments/new/_components/procedure-schedule-section';
import { getDurationMinutes } from '@/app/(protected)/appointments/new/_utils/appointment-time';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RescheduleAppointmentLoader from '../loader';
import { useRescheduleAppointmentForm } from './use-reschedule-appointment';

export function RescheduleAppointmentPageImpl({ appointmentId }: { appointmentId: number }) {
  const reschedule = useRescheduleAppointmentForm(appointmentId);
  const { appointment, form, values } = reschedule;

  if (reschedule.isLoading) return <RescheduleAppointmentLoader />;

  if (reschedule.error || !appointment) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Appointment</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{getApiErrorMessage(reschedule.error)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => reschedule.retryAppointment()}
          >
            <RefreshCw className="size-4" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const returnHref = `/appointments?date=${encodeURIComponent(appointment.slotDate)}&appointment=${appointment.id}`;

  if (!reschedule.isEligible) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href={returnHref}>
            <ArrowLeft className="size-4" /> Back to Appointments
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Appointment cannot be rescheduled</AlertTitle>
          <AlertDescription>
            Only Scheduled or Confirmed Appointments can be rescheduled. This Appointment is{' '}
            {appointment.appointmentStatus.name}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentTime =
    appointment.startTime && appointment.endTime
      ? `${appointment.startTime}–${appointment.endTime}`
      : appointment.slots.map((slot) => slot.slotTime).join(', ');
  const recommendedDuration =
    getDurationMinutes(appointment.startTime ?? '', appointment.endTime ?? '') || 15;

  return (
    <form
      onSubmit={reschedule.onSubmit}
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href={returnHref}>
              <ArrowLeft className="size-4" /> Back to Appointments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reschedule Appointment</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Change the schedule for <span className="font-mono">{appointment.bookingNumber}</span>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="text-primary size-4 shrink-0" />
          <div>
            <p className="font-medium">{reschedule.tenant?.name ?? 'Current Tenant'}</p>
            <p className="text-muted-foreground text-xs">Times use the Tenant time zone</p>
          </div>
        </div>
      </header>

      <Card className="shadow-fluent-2">
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
          <AlertCircle className="size-4" />
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
            onRetry={() => void reschedule.retryDoctorSlots()}
            onContextChange={reschedule.changeScheduleContext}
            onRotaChange={reschedule.changeRota}
            onTimeChange={reschedule.changeTime}
          />
        </div>
      )}

      <footer className="bg-card shadow-fluent-8 sticky bottom-0 z-20 mt-auto flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:p-4">
        <CalendarClock className="text-primary hidden size-5 sm:block" />
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
          <CalendarClock className="size-4" />
          {reschedule.mutation.isPending ? 'Rescheduling…' : 'Reschedule Appointment'}
        </Button>
      </footer>
    </form>
  );
}
