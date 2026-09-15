import { CalendarClock, CircleCheck } from 'lucide-react';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentsTable, AppointmentsTableSkeleton } from './appointments-table';

type AppointmentDaySectionProps = {
  id: string;
  title: string;
  appointments: Appointment[];
  description: string;
  emptyDescription: string;
  kind: 'upcoming' | 'completed';
  onCancel: (appointment: Appointment) => void;
};

export function AppointmentDaySection({
  id,
  kind,
  title,
  appointments,
  description,
  emptyDescription,
  onCancel,
}: AppointmentDaySectionProps) {
  const Icon = kind === 'upcoming' ? CalendarClock : CircleCheck;
  const iconClassName = kind === 'upcoming' ? 'text-primary' : 'text-success';
  const badgeClassName =
    kind === 'upcoming'
      ? 'border-primary/25 bg-primary/10 text-primary'
      : 'border-success/25 bg-success/10 text-success';

  return (
    <section className="space-y-2" aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
          <div>
            <h2 id={id} className="font-heading text-lg font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        <Badge variant="outline" className={badgeClassName}>
          {appointments.length}
        </Badge>
      </div>

      {appointments.length > 0 ? (
        <AppointmentsTable appointments={appointments} label={title} onCancel={onCancel} />
      ) : (
        <Card className="shadow-fluent-2">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">{emptyDescription}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export function AppointmentDaySectionSkeleton() {
  return (
    <section className="space-y-2" aria-label="Loading appointments">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-5 w-8" />
      </div>
      <AppointmentsTableSkeleton />
    </section>
  );
}
