import { CiCalendar, CiCircleCheck, CiClock1 } from 'react-icons/ci';
import { PiUserCheckLight } from 'react-icons/pi';

import type { summarizeAppointmentDay } from '@/app/queries/appointments/useAppointments';
import { StatCard } from '@/components/app/stat-card';

type AppointmentDaySummary = ReturnType<typeof summarizeAppointmentDay>;

export function AppointmentSummary({ summary }: { summary: AppointmentDaySummary }) {
  const countPrefix = summary.hasMore ? '≥' : '';

  return (
    <section
      aria-label="Today's Appointment totals"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        label="Appointments today"
        value={summary.total}
        hint="All booking statuses"
        icon={CiCalendar}
      />
      <StatCard
        label="Awaiting arrival"
        value={`${countPrefix}${summary.counts.scheduled + summary.counts.confirmed}`}
        hint="Scheduled and confirmed"
        icon={CiClock1}
        tone="warning"
      />
      <StatCard
        label="Checked in"
        value={`${countPrefix}${summary.counts.checkedIn}`}
        hint="Patients at the Facility"
        icon={PiUserCheckLight}
        tone="primary"
      />
      <StatCard
        label="Completed"
        value={`${countPrefix}${summary.counts.completed}`}
        hint="Finished Appointments"
        icon={CiCircleCheck}
        tone="success"
      />
    </section>
  );
}
