'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarDays } from 'lucide-react';

import {
  toDateInputValue,
  todayDisplayDate,
} from '@/app/(protected)/appointments/_utils/appointment-date';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentDashboardQuery } from '@/app/queries/appointments/useAppointments';
import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import DashboardPageLoader from '../loader';
import { AppointmentInsights } from './appointment-insights';
import { AppointmentSummary } from './appointment-summary';
import { TodayAppointmentList } from './today-appointment-list';

export function AppointmentDashboard() {
  const slotDate = todayDisplayDate();
  const currentUserQuery = useCurrentUserQuery();
  const canRead = currentUserQuery.data?.permissions.includes('appointment:read') ?? false;
  const appointmentsQuery = useAppointmentDashboardQuery(slotDate, canRead);

  if (currentUserQuery.isLoading || (canRead && appointmentsQuery.isLoading)) {
    return <DashboardPageLoader />;
  }

  if (currentUserQuery.isError || !currentUserQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load your dashboard</AlertTitle>
        <AlertDescription>{getApiErrorMessage(currentUserQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const summary = appointmentsQuery.data;
  const appointmentsHref = `/appointments?date=${encodeURIComponent(slotDate)}`;

  return (
    <div className="space-y-4">
      <section className="from-primary/10 via-card to-procedure/10 border-primary/20 shadow-fluent-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-gradient-to-br p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold">Today’s Appointments</h2>
            <p className="text-muted-foreground text-xs">
              <time dateTime={toDateInputValue(slotDate)}>{slotDate}</time> · Tenant-wide overview
            </p>
          </div>
        </div>
        {canRead ? (
          <Button asChild variant="outline" size="sm">
            <Link href={appointmentsHref}>
              Open Appointments <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </section>

      {!canRead ? (
        <Card className="shadow-fluent-2">
          <CardContent>
            <p className="font-medium">Appointment access required</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your Role does not include permission to view Appointments.
            </p>
          </CardContent>
        </Card>
      ) : appointmentsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Appointments</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{getApiErrorMessage(appointmentsQuery.error)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void appointmentsQuery.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : summary ? (
        <>
          <AppointmentSummary summary={summary} />
          {summary.hasMore ? (
            <p className="text-muted-foreground text-sm">
              Status and booking-path counts cover the first 999 of {summary.total} Appointments.
              Open Appointments to review the full day.
            </p>
          ) : null}
          <div className="grid items-start gap-3 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <TodayAppointmentList
                appointments={summary.activeAppointments}
                slotDate={slotDate}
                hasAppointments={summary.total > 0}
                hasMore={summary.hasMore}
              />
            </div>
            <AppointmentInsights summary={summary} />
          </div>
        </>
      ) : null}
    </div>
  );
}
