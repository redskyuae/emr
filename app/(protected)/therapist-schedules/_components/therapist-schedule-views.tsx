import { CalendarClock, CalendarDays, Clock, Pencil } from 'lucide-react';

import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
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

type TherapistScheduleViewProps = {
  schedules: TherapistSchedule[];
  therapistNameById: Map<number, string>;
  canEdit: boolean;
  onEdit: (schedule: TherapistSchedule) => void;
};

function formatDateRange(schedule: TherapistSchedule) {
  return schedule.slotFromDate === schedule.slotToDate
    ? schedule.slotFromDate
    : `${schedule.slotFromDate} to ${schedule.slotToDate}`;
}

function formatRotas(schedule: TherapistSchedule) {
  return schedule.rotaDetails.map(({ rotaName }) => rotaName).join(', ');
}

function formatRotaTimes(schedule: TherapistSchedule) {
  return schedule.rotaDetails.map(({ rotaTime }) => rotaTime).join(' · ');
}

function getTherapistName(schedule: TherapistSchedule, therapistNameById: Map<number, string>) {
  return therapistNameById.get(schedule.therapistId) ?? `Therapist #${schedule.therapistId}`;
}

function TherapistScheduleStatusBadge({ schedule }: { schedule: TherapistSchedule }) {
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

function TherapistScheduleAvatar() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
      <CalendarClock className="size-5" />
    </div>
  );
}

function TherapistScheduleEditButton({
  schedule,
  onEdit,
}: {
  schedule: TherapistSchedule;
  onEdit: (schedule: TherapistSchedule) => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={`Edit Therapist Schedule ${schedule.id}`}
      onClick={() => onEdit(schedule)}
    >
      <Pencil className="size-4" />
    </Button>
  );
}

export function TherapistScheduleTableView({
  schedules,
  therapistNameById,
  canEdit,
  onEdit,
}: TherapistScheduleViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Therapist</TableHead>
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
                    {getTherapistName(schedule, therapistNameById)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatDateRange(schedule)}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{formatRotas(schedule)}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {formatRotaTimes(schedule)}
                    </p>
                  </TableCell>
                  <TableCell>{schedule.slotDurationMinutes} min</TableCell>
                  <TableCell>
                    <TherapistScheduleStatusBadge schedule={schedule} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {canEdit ? (
                      <TherapistScheduleEditButton schedule={schedule} onEdit={onEdit} />
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

export function TherapistScheduleCardView({
  schedules,
  therapistNameById,
  canEdit,
  onEdit,
}: TherapistScheduleViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <TherapistScheduleAvatar />
              <TherapistScheduleStatusBadge schedule={schedule} />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold break-words">
                {getTherapistName(schedule, therapistNameById)}
              </h3>
              <p className="flex items-center gap-1.5 font-mono text-sm">
                <CalendarDays className="text-muted-foreground size-3.5 shrink-0" />
                {formatDateRange(schedule)}
              </p>
              <p className="flex items-center gap-1.5 text-sm">
                <Clock className="text-muted-foreground size-3.5 shrink-0" />
                {schedule.slotDurationMinutes} min slots
              </p>
            </div>

            {schedule.rotaDetails.length > 0 ? (
              <div className="space-y-0.5 text-sm">
                <p className="break-words">{formatRotas(schedule)}</p>
                <p className="text-muted-foreground text-xs break-words">
                  {formatRotaTimes(schedule)}
                </p>
              </div>
            ) : null}

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

export function TherapistScheduleListView({
  schedules,
  therapistNameById,
  canEdit,
  onEdit,
}: TherapistScheduleViewProps) {
  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
              <TherapistScheduleAvatar />
              <div className="min-w-0">
                <h3 className="font-heading truncate text-base font-semibold">
                  {getTherapistName(schedule, therapistNameById)}
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
              <TherapistScheduleStatusBadge schedule={schedule} />
            </div>

            {canEdit ? (
              <div className="shrink-0 pl-14 sm:pl-0">
                <TherapistScheduleEditButton schedule={schedule} onEdit={onEdit} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
