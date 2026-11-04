import { CalendarClock, CalendarDays, Clock, Pencil } from 'lucide-react';

import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type DoctorScheduleViewProps = {
  schedules: DoctorSchedule[];
  doctorNameById: Map<number, string>;
  canEdit: boolean;
  onEdit: (schedule: DoctorSchedule) => void;
};

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}-${month}-${year}` : isoDate;
}

function formatDateRange(schedule: DoctorSchedule) {
  const fromDate = formatDisplayDate(schedule.slotFromDate);

  if (schedule.slotFromDate === schedule.slotToDate) {
    return fromDate;
  }

  return `${fromDate} to ${formatDisplayDate(schedule.slotToDate)}`;
}

function formatRotas(schedule: DoctorSchedule) {
  if (schedule.rotaDetails.length === 0) {
    return 'No rotas assigned';
  }

  return schedule.rotaDetails.map((rota) => rota.rotaName).join(', ');
}

function formatRotaTimes(schedule: DoctorSchedule) {
  return schedule.rotaDetails.map((rota) => rota.rotaTime).join(' · ');
}

function getDoctorName(schedule: DoctorSchedule, doctorNameById: Map<number, string>) {
  return doctorNameById.get(schedule.doctorId) ?? `Doctor #${schedule.doctorId}`;
}

function DoctorScheduleStatusBadge({ schedule }: { schedule: DoctorSchedule }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        schedule.isActive
          ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
          : 'bg-muted/60 text-muted-foreground'
      )}
    >
      {schedule.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function DoctorScheduleAvatar() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
      <CalendarClock className="size-5" />
    </div>
  );
}

function DoctorScheduleEditButton({
  schedule,
  onEdit,
}: {
  schedule: DoctorSchedule;
  onEdit: (schedule: DoctorSchedule) => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={`Edit Doctor Schedule ${schedule.id}`}
      onClick={() => onEdit(schedule)}
    >
      <Pencil className="size-4" />
    </Button>
  );
}

export function DoctorScheduleTableView({
  schedules,
  doctorNameById,
  canEdit,
  onEdit,
}: DoctorScheduleViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Doctor</TableHead>
                <TableHead>Date range</TableHead>
                <TableHead>Rotas</TableHead>
                <TableHead>Slot duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10 pr-4" aria-label="Actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="pl-4 font-medium">
                    {getDoctorName(schedule, doctorNameById)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatDateRange(schedule)}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{formatRotas(schedule)}</p>
                    {schedule.rotaDetails.length > 0 ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {formatRotaTimes(schedule)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{schedule.slotDurationMinutes} min</TableCell>
                  <TableCell>
                    <DoctorScheduleStatusBadge schedule={schedule} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canEdit ? (
                      <DoctorScheduleEditButton schedule={schedule} onEdit={onEdit} />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DoctorScheduleCardView({
  schedules,
  doctorNameById,
  canEdit,
  onEdit,
}: DoctorScheduleViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <DoctorScheduleAvatar />
              <DoctorScheduleStatusBadge schedule={schedule} />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold">
                {getDoctorName(schedule, doctorNameById)}
              </h3>
              <p className="flex items-center gap-1.5 font-mono text-sm">
                <CalendarDays className="text-muted-foreground size-3.5" />
                {formatDateRange(schedule)}
              </p>
              <p className="flex items-center gap-1.5 text-sm">
                <Clock className="text-muted-foreground size-3.5" />
                {schedule.slotDurationMinutes} min slots
              </p>
            </div>

            <div className="space-y-0.5 text-sm">
              <p>{formatRotas(schedule)}</p>
              {schedule.rotaDetails.length > 0 ? (
                <p className="text-muted-foreground text-xs">{formatRotaTimes(schedule)}</p>
              ) : null}
            </div>

            {canEdit ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(schedule)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DoctorScheduleListView({
  schedules,
  doctorNameById,
  canEdit,
  onEdit,
}: DoctorScheduleViewProps) {
  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
              <DoctorScheduleAvatar />
              <div className="min-w-0">
                <h3 className="font-heading truncate text-base font-semibold">
                  {getDoctorName(schedule, doctorNameById)}
                </h3>
                <p className="text-muted-foreground truncate font-mono text-sm">
                  {formatDateRange(schedule)}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0 sm:flex-1">
                <p className="break-words">{formatRotas(schedule)}</p>
                {schedule.rotaDetails.length > 0 ? (
                  <p className="text-muted-foreground text-xs break-words">
                    {formatRotaTimes(schedule)}
                  </p>
                ) : null}
              </div>
              <span className="text-muted-foreground shrink-0">
                {schedule.slotDurationMinutes} min
              </span>
              <DoctorScheduleStatusBadge schedule={schedule} />
            </div>

            {canEdit ? (
              <div className="shrink-0 pl-14 sm:pl-0">
                <DoctorScheduleEditButton schedule={schedule} onEdit={onEdit} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
