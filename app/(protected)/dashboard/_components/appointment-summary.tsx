import { CalendarDays, CircleCheck, Clock3, UserRoundCheck } from 'lucide-react';

import type { summarizeAppointmentDay } from '@/app/queries/appointments/useAppointments';
import { Card, CardContent } from '@/components/ui/card';

type AppointmentDaySummary = ReturnType<typeof summarizeAppointmentDay>;

export function AppointmentSummary({ summary }: { summary: AppointmentDaySummary }) {
  const countPrefix = summary.hasMore ? '≥' : '';
  const cards = [
    {
      title: 'Appointments today',
      value: summary.total,
      detail: 'All booking statuses',
      icon: CalendarDays,
      surface: 'border-primary/20 bg-primary/10',
      tone: 'bg-primary/15 text-primary',
      valueTone: 'text-primary',
    },
    {
      title: 'Awaiting arrival',
      value: `${countPrefix}${summary.counts.scheduled + summary.counts.confirmed}`,
      detail: 'Scheduled and confirmed',
      icon: Clock3,
      surface: 'border-warning/20 bg-warning/10',
      tone: 'bg-warning/15 text-warning',
      valueTone: 'text-warning',
    },
    {
      title: 'Checked in',
      value: `${countPrefix}${summary.counts.checkedIn}`,
      detail: 'Patients at the Facility',
      icon: UserRoundCheck,
      surface: 'border-primary/20 bg-accent',
      tone: 'bg-primary/15 text-primary',
      valueTone: 'text-primary',
    },
    {
      title: 'Completed',
      value: `${countPrefix}${summary.counts.completed}`,
      detail: 'Finished Appointments',
      icon: CircleCheck,
      surface: 'border-success/20 bg-success/10',
      tone: 'bg-success/15 text-success',
      valueTone: 'text-success',
    },
  ];

  return (
    <section
      aria-label="Today's Appointment totals"
      className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <Card key={card.title} size="sm" className={`shadow-fluent-2 border ${card.surface}`}>
          <CardContent className="flex items-center justify-between gap-2">
            <div>
              <p className="text-muted-foreground text-xs font-medium">{card.title}</p>
              <p
                className={`font-heading text-2xl leading-tight font-semibold tabular-nums ${card.valueTone}`}
              >
                {card.value}
              </p>
              <p className="text-muted-foreground text-xs">{card.detail}</p>
            </div>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-md ${card.tone}`}
            >
              <card.icon className="size-4" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
