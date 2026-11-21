// Properties of `schedule_changed` for a DoctorSchedule or TherapistSchedule. The Doctor or
// Therapist, the rotas themselves and the dates are never sent: only how many rotas and days.

import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type ScheduleChange = AnalyticsEventProperties<'schedule_changed'>;

type SavedSchedule = {
  slotFromDate: string;
  slotToDate: string;
  rotaDetails: readonly unknown[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar days from the first to the last schedule date, both included; 0 if unreadable. */
function spanDays(fromDate: string, toDate: string) {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return 0;
  }

  return Math.max(0, Math.round((to - from) / MS_PER_DAY) + 1);
}

export function scheduleChangedProperties(
  scheduleKind: ScheduleChange['schedule_kind'],
  action: ScheduleChange['action'],
  schedule: SavedSchedule
): ScheduleChange {
  return {
    action,
    span_days: spanDays(schedule.slotFromDate, schedule.slotToDate),
    rota_count: schedule.rotaDetails.length,
    schedule_kind: scheduleKind,
  };
}
