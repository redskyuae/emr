'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useRoomTypesQuery } from '@/app/queries/room-masters/room-types/useRoomTypes';
import { useCreateRoom } from '@/app/queries/rooms/useCreateRoom';
import { useUpdateRoom } from '@/app/queries/rooms/useUpdateRoom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { roomFormSchema, type RoomFormValues } from '../../_utils/room-form-schema';
import { ROOM_STATUS_OPTIONS } from '../../_utils/room-status';

const EMPTY_DEFAULTS: RoomFormValues = {
  roomNumber: '',
  roomTypeId: '',
  status: 'AVAILABLE',
  bedCount: '1',
  floor: '',
  wing: '',
  facility: '',
  department: '',
  notes: '',
};

type RoomFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  roomId: number | null;
  room: Room | null;
  isResolving: boolean;
  onClose: () => void;
};

export function RoomFormSheet({
  open,
  mode,
  roomId,
  room,
  isResolving,
  onClose,
}: RoomFormSheetProps) {
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const roomTypesQuery = useRoomTypesQuery({ limit: 100 });
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<RoomFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(roomFormSchema),
  });

  const roomTypes = roomTypesQuery.data?.data ?? [];
  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : roomId === null ? null : String(roomId);

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (sessionKey === null || isResolving) {
      return;
    }

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    form.reset({
      roomNumber: room?.roomNumber ?? '',
      roomTypeId: room ? String(room.roomTypeId) : '',
      status: room?.status ?? 'AVAILABLE',
      bedCount: room ? String(room.bedCount) : '1',
      floor: room?.floor ?? '',
      wing: room?.wing ?? '',
      facility: room?.facility ?? '',
      department: room?.department ?? '',
      notes: room?.notes ?? '',
    });
  }, [open, sessionKey, isResolving, room, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request = {
      roomNumber: values.roomNumber,
      roomTypeId: Number(values.roomTypeId),
      status: values.status,
      bedCount: Number(values.bedCount),
      floor: values.floor.trim(),
      wing: values.wing.trim(),
      facility: values.facility.trim(),
      department: values.department.trim(),
      notes: values.notes.trim(),
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Room created.');
        onClose();
        return;
      }

      if (roomId === null) {
        return;
      }

      await updateMutation.mutateAsync({ id: roomId, request });
      toast.success('Room updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Room' : `Edit Room ${room?.roomNumber ?? ''}`.trim();
  const sheetDescription = isCreating
    ? 'Create a new Room in this Tenant.'
    : 'Update the Room details and its Room Status.';

  const hasNoRoomTypes = !roomTypesQuery.isLoading && roomTypes.length === 0;

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {isResolving ? (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form id="room-form" onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {serverErrors.length > 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4">
                      {serverErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {hasNoRoomTypes ? (
                <Alert className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>No Room Types configured</AlertTitle>
                  <AlertDescription>
                    Add a Room Type under Configuration before creating Rooms.
                  </AlertDescription>
                </Alert>
              ) : null}

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="roomNumber"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-number">
                        Room number{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="room-number"
                        {...field}
                        disabled={isSaving}
                        maxLength={20}
                        placeholder="e.g. 101-A"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="roomTypeId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-type-id">
                        Room Type{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving || hasNoRoomTypes}
                      >
                        <SelectTrigger
                          id="room-type-id"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select a Room Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((roomType) => (
                            <SelectItem key={roomType.id} value={String(roomType.id)}>
                              {roomType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="status"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-status">
                        Status{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving}
                      >
                        <SelectTrigger
                          id="room-status"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select a Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="bedCount"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-bed-count">
                        Bed count{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="room-bed-count"
                        {...field}
                        type="number"
                        min={1}
                        max={50}
                        step={1}
                        inputMode="numeric"
                        disabled={isSaving}
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="floor"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="room-floor">Floor</FieldLabel>
                        <Input
                          id="room-floor"
                          {...field}
                          disabled={isSaving}
                          maxLength={20}
                          placeholder="e.g. 1"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="wing"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="room-wing">Wing</FieldLabel>
                        <Input
                          id="room-wing"
                          {...field}
                          disabled={isSaving}
                          maxLength={50}
                          placeholder="e.g. East"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="facility"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-facility">Facility</FieldLabel>
                      <Input
                        id="room-facility"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="e.g. Apollo Main Hospital"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="department"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-department">Department</FieldLabel>
                      <Input
                        id="room-department"
                        {...field}
                        disabled={isSaving}
                        maxLength={150}
                        placeholder="e.g. Cardiology"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-notes">Notes</FieldLabel>
                      <Textarea
                        id="room-notes"
                        {...field}
                        disabled={isSaving}
                        rows={3}
                        maxLength={500}
                        placeholder="Optional notes"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            <SheetFooter className="bg-background flex-row justify-end border-t p-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="room-form"
                disabled={isSaving || hasNoRoomTypes}
                aria-busy={isSaving}
              >
                <Save className="size-4" />
                Save
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
