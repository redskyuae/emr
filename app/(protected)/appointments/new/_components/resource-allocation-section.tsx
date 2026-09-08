'use client';

import { DoorOpen, UserRound } from 'lucide-react';
import { useFormState, type Control } from 'react-hook-form';
import type { CSSProperties } from 'react';
import { BookingStatusBadge } from './booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { DemoRoom, DemoSession, DemoTherapist } from './book-appointment-demo-data';

export function ResourceAllocationSection({
  control,
  rooms,
  therapists,
  session,
  canAllocate,
  selectedRoomId,
  selectedTherapistId,
  onRoomChange,
  onTherapistChange,
}: {
  control: Control<BookAppointmentFormValues>;
  rooms: DemoRoom[];
  therapists: DemoTherapist[];
  session: DemoSession | null;
  canAllocate: boolean;
  selectedRoomId: string;
  selectedTherapistId: string;
  onRoomChange: (value: string) => void;
  onTherapistChange: (value: string) => void;
}) {
  const { errors } = useFormState({ control, name: ['roomId', 'therapistId'] });
  const resourceRows = Math.max(rooms.length, therapists.length, 1);
  const rowStyle = {
    '--resource-rows': 'auto repeat(' + resourceRows + ', minmax(0, 1fr)) auto',
    '--resource-span': resourceRows + 2,
  } as CSSProperties;
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-procedure/15 border-b">
        <CardTitle>Room & Therapist</CardTitle>
        <CardDescription>Match the Treatment requirements at this Facility.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canAllocate ? (
          <p className="border-primary/20 bg-primary/5 text-primary rounded-lg border p-3 text-sm">
            Choose a date and start time to select resources.
          </p>
        ) : null}
        <div
          style={rowStyle}
          className="grid gap-x-4 gap-y-2 sm:grid-cols-2 sm:grid-rows-(--resource-rows) lg:grid-cols-1 lg:grid-rows-none xl:grid-cols-2 xl:grid-rows-(--resource-rows)"
        >
          <div className="grid min-w-0 gap-2 sm:row-span-(--resource-span) sm:grid-rows-subgrid lg:row-auto lg:grid-rows-none xl:row-span-(--resource-span) xl:grid-rows-subgrid">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <DoorOpen className="text-primary size-4" /> Room{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </h3>
              <p className="text-muted-foreground text-xs">
                {session?.roomType ?? 'Choose a Treatment'}
              </p>
            </div>
            {rooms.map((room) => (
              <ResourceOption
                key={room.id}
                title={room.name}
                detail={room.location + ' · Capacity ' + room.capacity}
                status={room.status}
                conflict={room.conflictReason}
                available={canAllocate && room.status === 'Ready' && !room.conflictReason}
                selected={selectedRoomId === String(room.id)}
                onSelect={() => onRoomChange(String(room.id))}
              />
            ))}
            {Array.from({ length: resourceRows - rooms.length }, (_, index) => (
              <div
                key={'room-empty-' + index}
                className="hidden sm:block lg:hidden xl:block"
                aria-hidden="true"
              />
            ))}
            <div>
              {canAllocate && !rooms.length ? (
                <p className="text-muted-foreground text-sm">
                  No matching Room. Choose another Treatment or Session.
                </p>
              ) : null}
              <FieldError errors={[errors.roomId]} />
            </div>
          </div>
          <div className="grid min-w-0 gap-2 sm:row-span-(--resource-span) sm:grid-rows-subgrid lg:row-auto lg:grid-rows-none xl:row-span-(--resource-span) xl:grid-rows-subgrid">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="text-primary size-4" /> Therapist{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </h3>
              <p className="text-muted-foreground text-xs">
                {session?.therapistSkill ?? 'Choose a Treatment'}
              </p>
            </div>
            {therapists.map((therapist) => (
              <ResourceOption
                key={therapist.id}
                title={therapist.name}
                detail={therapist.role + ' · ' + therapist.skill}
                extra={therapist.license + ' · ' + therapist.workload}
                status={therapist.active && !therapist.conflictReason ? 'Available' : 'Unavailable'}
                conflict={therapist.conflictReason}
                available={canAllocate && therapist.active && !therapist.conflictReason}
                selected={selectedTherapistId === String(therapist.id)}
                onSelect={() => onTherapistChange(String(therapist.id))}
              />
            ))}
            {Array.from({ length: resourceRows - therapists.length }, (_, index) => (
              <div
                key={'therapist-empty-' + index}
                className="hidden sm:block lg:hidden xl:block"
                aria-hidden="true"
              />
            ))}
            <div>
              {canAllocate && !therapists.length ? (
                <p className="text-muted-foreground text-sm">
                  No matching Therapist. Choose another Treatment or Session.
                </p>
              ) : null}
              <FieldError errors={[errors.therapistId]} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceOption({
  title,
  detail,
  extra,
  status,
  conflict,
  available,
  selected,
  onSelect,
}: {
  title: string;
  detail: string;
  extra?: string;
  status: string;
  conflict?: string;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone =
    status === 'Ready' || status === 'Available'
      ? 'success'
      : status === 'Cleaning required' || status === 'Maintenance' || status === 'In use'
        ? 'warning'
        : 'danger';
  return (
    <Button
      type="button"
      variant="outline"
      aria-disabled={!available}
      aria-pressed={selected}
      onClick={() => {
        if (available) onSelect();
      }}
      className={cn(
        'h-full min-h-40 w-full flex-col items-start justify-start gap-2 p-3 text-left whitespace-normal',
        tone === 'success' && 'border-success/25 bg-success/5 hover:bg-success/10',
        tone === 'warning' && 'border-warning/25 bg-warning/5 hover:bg-warning/5',
        tone === 'danger' && 'border-destructive/20 bg-destructive/5 hover:bg-destructive/5',
        selected && 'border-primary bg-primary/5 ring-primary/15 hover:bg-primary/10 ring-2',
        !available && 'cursor-not-allowed'
      )}
    >
      <span className="w-full font-medium">{title}</span>
      <span className="text-muted-foreground text-xs font-normal">{detail}</span>
      {extra ? <span className="text-muted-foreground text-xs font-normal">{extra}</span> : null}
      {conflict ? (
        <span
          className={cn(
            'text-xs font-normal',
            tone === 'warning' ? 'text-warning' : 'text-destructive'
          )}
        >
          {conflict}
        </span>
      ) : null}
      <span className="mt-auto flex flex-wrap gap-2 pt-1">
        <BookingStatusBadge tone={tone}>{status}</BookingStatusBadge>
        {selected ? <BookingStatusBadge tone="selected">Selected</BookingStatusBadge> : null}
      </span>
    </Button>
  );
}

export function ResourceStatus({
  consentStatus,
  approvalStatus,
}: {
  consentStatus: string;
  approvalStatus: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        ['Consent', consentStatus],
        ['Approval', approvalStatus],
      ].map(([label, status]) => (
        <BookingStatusBadge
          key={label}
          tone={
            status === 'READY'
              ? 'success'
              : status === 'BLOCKED'
                ? 'danger'
                : status === 'PENDING'
                  ? 'warning'
                  : 'neutral'
          }
        >
          {label}:{' '}
          {status === 'NOT_REQUIRED'
            ? 'Not required'
            : status.charAt(0) + status.slice(1).toLowerCase()}
        </BookingStatusBadge>
      ))}
    </div>
  );
}
