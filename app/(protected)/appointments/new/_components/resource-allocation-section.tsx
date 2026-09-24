'use client';

import { DoorOpen, UserRound } from 'lucide-react';
import { useFormState, type Control } from 'react-hook-form';
import type { CSSProperties } from 'react';
import { BookingStatusBadge } from './booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import type { BookingSession } from './book-appointment-demo-data';

export function ResourceAllocationSection({
  control,
  rooms,
  isRoomsLoading,
  therapists,
  isTherapistsLoading,
  session,
  requiresRoom,
  requiresTherapist,
  canAllocate,
  selectedRoomId,
  selectedTherapistId,
  onRoomChange,
  onTherapistChange,
}: {
  control: Control<BookAppointmentFormValues>;
  rooms: Room[];
  isRoomsLoading: boolean;
  therapists: Therapist[];
  isTherapistsLoading: boolean;
  session: BookingSession | null;
  requiresRoom: boolean;
  requiresTherapist: boolean;
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
        <CardDescription>
          Choose an available Room and qualified Therapist at this Facility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!requiresRoom && !requiresTherapist ? (
          <p className="border-warning/25 bg-warning/5 rounded-lg border p-3 text-sm">
            Room and Therapist requirements are not configured for this Session. Resource filtering
            is skipped.
          </p>
        ) : null}
        {!canAllocate && (requiresRoom || requiresTherapist) ? (
          <p className="border-primary/20 bg-primary/5 text-primary rounded-lg border p-3 text-sm">
            Choose a date and start time to select resources.
          </p>
        ) : null}
        <div
          style={rowStyle}
          className="grid gap-x-4 gap-y-2 sm:grid-cols-2 sm:grid-rows-(--resource-rows) lg:grid-cols-1 lg:grid-rows-none xl:grid-cols-2 xl:grid-rows-(--resource-rows)"
        >
          {requiresRoom ? (
            <div className="grid min-w-0 gap-2 sm:row-span-(--resource-span) sm:grid-rows-subgrid lg:row-auto lg:grid-rows-none xl:row-span-(--resource-span) xl:grid-rows-subgrid">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <DoorOpen className="text-primary size-4" /> Room{' '}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </h3>
                <p className="text-muted-foreground text-xs">Available Rooms for this Procedure</p>
              </div>
              {rooms.map((room) => (
                <ResourceOption
                  key={room.id}
                  title={`Room ${room.roomNumber}`}
                  detail={
                    getRoomLocation(room) +
                    ' · ' +
                    room.bedCount +
                    ' bed' +
                    (room.bedCount === 1 ? '' : 's')
                  }
                  status={getRoomStatusLabel(room.status)}
                  available={canAllocate}
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
                {canAllocate && isRoomsLoading ? (
                  <p className="text-muted-foreground text-sm">Loading matching Rooms…</p>
                ) : null}
                {canAllocate && !isRoomsLoading && !rooms.length ? (
                  <p className="text-muted-foreground text-sm">No Room is currently available.</p>
                ) : null}
                <FieldError errors={[errors.roomId]} />
              </div>
            </div>
          ) : null}
          {requiresTherapist ? (
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
                  detail={
                    (therapist.designation ?? 'Therapist') +
                    ' · ' +
                    therapist.skills.map((skill) => skill.name).join(', ')
                  }
                  extra={
                    therapist.registrationNumber
                      ? `Registration ${therapist.registrationNumber}`
                      : undefined
                  }
                  status={therapist.isActive ? 'Active' : 'Inactive'}
                  available={canAllocate && therapist.isActive}
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
                {canAllocate && isTherapistsLoading ? (
                  <p className="text-muted-foreground text-sm">Loading matching Therapists…</p>
                ) : null}
                {canAllocate && !isTherapistsLoading && !therapists.length ? (
                  <p className="text-muted-foreground text-sm">
                    No matching Therapist. Choose another Treatment or Session.
                  </p>
                ) : null}
                <FieldError errors={[errors.therapistId]} />
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function getRoomLocation(room: Room) {
  const location = [room.facility, room.wing, room.floor].filter((value): value is string =>
    Boolean(value)
  );

  return location.length > 0 ? location.join(' · ') : room.roomType.name;
}

function getRoomStatusLabel(status: Room['status']) {
  return status.charAt(0) + status.slice(1).toLowerCase();
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
    status === 'Ready' || status === 'Available' || status === 'Active'
      ? 'success'
      : status === 'Cleaning' ||
          status === 'Maintenance' ||
          status === 'Occupied' ||
          status === 'Reserved'
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
