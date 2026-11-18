'use client';

import Link from 'next/link';
import { CiCircleAlert } from 'react-icons/ci';
import { PiArrowRightLight } from 'react-icons/pi';

import {
  toDateInputValue,
  todayDisplayDate,
} from '@/app/(protected)/appointments/_utils/appointment-date';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentDashboardQuery } from '@/app/queries/appointments/useAppointments';
import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { StatCardSkeleton } from '@/components/app/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AppointmentInsights } from './appointment-insights';
import { AppointmentSummary } from './appointment-summary';
import { TodayAppointmentList } from './today-appointment-list';

export function AppointmentDashboard() {
  const slotDate = todayDisplayDate();
  const currentUserQuery = useCurrentUserQuery();
  const canRead = currentUserQuery.data?.permissions.includes('appointment:read') ?? false;
  const appointmentsQuery = useAppointmentDashboardQuery(slotDate, canRead);

  if (currentUserQuery.isError || (!currentUserQuery.isLoading && !currentUserQuery.data)) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load your dashboard</AlertTitle>
        <AlertDescription>{getApiErrorMessage(currentUserQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const summary = appointmentsQuery.data;
  const appointmentsHref = `/appointments?date=${encodeURIComponent(slotDate)}`;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold tracking-tight">Today’s Appointments</h2>
          <p className="text-muted-foreground text-sm">
            <time dateTime={toDateInputValue(slotDate)}>{slotDate}</time> · Tenant-wide overview
          </p>
        </div>
        {/* Appears once the Role is known; it sits beside the heading, so nothing moves. */}
        {canRead ? (
          <Button asChild variant="outline">
            <Link href={appointmentsHref}>
              Open Appointments <PiArrowRightLight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </section>

      <SkeletonCrossfade
        isLoading={currentUserQuery.isLoading || (canRead && appointmentsQuery.isLoading)}
        skeleton={<AppointmentDashboardContentSkeleton />}
      >
        {!canRead ? (
          <Card>
            <CardContent>
              <p className="font-medium">Appointment access required</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Your Role does not include permission to view Appointments.
              </p>
            </CardContent>
          </Card>
        ) : appointmentsQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
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
          <div className="space-y-4">
            <AppointmentSummary summary={summary} />
            {summary.hasMore ? (
              <p className="text-muted-foreground text-sm">
                Status and booking-path counts cover the first 999 of {summary.total} Appointments.
                Open Appointments to review the full day.
              </p>
            ) : null}
            <div className="grid items-start gap-4 xl:grid-cols-3">
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
          </div>
        ) : null}
      </SkeletonCrossfade>
    </div>
  );
}

// Mirrors everything below the heading: the four stat cards, the Active schedule list with
// six rows (time, Patient and booking line, clinician, status) and the Appointment mix card.
export function AppointmentDashboardContentSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Appointment Dashboard">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <StatCardSkeleton key={item} hint />
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Active schedule</CardTitle>
            <CardDescription>First six active Appointments by time.</CardDescription>
            <CardAction>
              <Skeleton className="h-8 w-24" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <li
                  key={item}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 sm:flex-nowrap"
                >
                  <Skeleton className="mr-4 h-4 w-12 shrink-0" />
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-56 max-w-full" />
                  </span>
                  <span className="flex w-full items-center justify-between gap-3 pl-20 sm:contents">
                    <Skeleton className="h-3 w-24 sm:w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment mix</CardTitle>
            <CardDescription>Consultation and Procedure bookings today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              {['Consultation', 'Procedure'].map((label) => (
                <div key={label}>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Skeleton className="size-4 rounded-full" />
                    {label}
                  </div>
                  <Skeleton className="mt-1.5 h-6 w-10" />
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold">Exceptions today</h3>
              <Skeleton className="mt-2 h-4 w-56 max-w-full" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
