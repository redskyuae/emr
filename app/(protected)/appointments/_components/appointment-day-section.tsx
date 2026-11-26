import Link from 'next/link';
import { CiCalendar, CiCalendarDate } from 'react-icons/ci';
import { PiCalendarBlankDuotone, PiMagnifyingGlassDuotone, PiPlusLight } from 'react-icons/pi';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentsTable, AppointmentsTableSkeleton } from './appointments-table';

const EMPTY_COPY = {
  today: {
    title: 'No Appointments today',
    description: 'Appointments booked for today appear here.',
    filtered: 'No Appointments scheduled for today match the current filters.',
  },
  upcoming: {
    title: 'No upcoming Appointments',
    filtered: 'No future Appointments match the current filters.',
    description: 'Future Appointments appear here once they are booked.',
  },
};

type AppointmentDaySectionProps = {
  id: string;
  title: string;
  appointments: Appointment[];
  description: string;
  /** A Doctor, Therapist or status filter, or a search, is narrowing the list. */
  isFiltered: boolean;
  /** Replaces the kind's filtered empty-state text, e.g. for a From Date that may be in the past. */
  filteredEmptyDescription?: string;
  /** The user may book, so the "nothing yet" state offers Book Appointment. */
  canCreate: boolean;
  kind: 'today' | 'upcoming';
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  /** Omitted without `appointment:cancel`. */
  onCancel?: (appointment: Appointment) => void;
  canReschedule: boolean;
};

export function AppointmentDaySection({
  id,
  kind,
  title,
  appointments,
  description,
  isFiltered,
  filteredEmptyDescription,
  canCreate,
  total,
  totalPages,
  page,
  pageSize,
  isLoading,
  isFetching,
  onPageChange,
  onCancel,
  canReschedule,
}: AppointmentDaySectionProps) {
  const Icon = kind === 'today' ? CiCalendar : CiCalendarDate;

  return (
    <section className="space-y-2" aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Icon className="text-primary size-5" aria-hidden="true" />
          <div>
            <h2 id={id} className="font-heading text-lg font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-8 rounded-full" />
        ) : (
          <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
            {total}
          </Badge>
        )}
      </div>

      <SkeletonCrossfade isLoading={isLoading} skeleton={<AppointmentsTableSkeleton />}>
        {appointments.length > 0 ? (
          <AppointmentsTable
            appointments={appointments}
            label={title}
            total={total}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            isFetching={isFetching}
            onPageChange={onPageChange}
            onCancel={onCancel}
            canReschedule={canReschedule}
          />
        ) : (
          <Card>
            <CardContent>
              {isFiltered ? (
                <EmptyState
                  tone="neutral"
                  icon={PiMagnifyingGlassDuotone}
                  title="No results found"
                  description={filteredEmptyDescription ?? EMPTY_COPY[kind].filtered}
                />
              ) : (
                <EmptyState
                  tone="teal"
                  icon={PiCalendarBlankDuotone}
                  title={EMPTY_COPY[kind].title}
                  description={EMPTY_COPY[kind].description}
                  actions={
                    canCreate ? (
                      <Button type="button" asChild>
                        <Link href="/appointments/new">
                          <PiPlusLight className="size-4" />
                          Book Appointment
                        </Link>
                      </Button>
                    ) : null
                  }
                />
              )}
            </CardContent>
          </Card>
        )}
      </SkeletonCrossfade>
    </section>
  );
}

// The route loader's version of the section: the heading row (icon, title, description and
// count) over the table skeleton. The page itself keeps its real heading while loading.
export function AppointmentDaySectionSkeleton() {
  return (
    <section className="space-y-2" aria-label="Loading appointments">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <div className="space-y-1.5 py-0.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-8 rounded-full" />
      </div>
      <AppointmentsTableSkeleton />
    </section>
  );
}
