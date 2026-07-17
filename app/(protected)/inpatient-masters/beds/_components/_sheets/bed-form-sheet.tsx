'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateBed } from '@/app/queries/inpatient-masters/beds/useCreateBed';
import { useUpdateBed } from '@/app/queries/inpatient-masters/beds/useUpdateBed';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
import { useRoomsQuery } from '@/app/queries/rooms/useRooms';
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
import { bedFormSchema, type BedFormValues } from '../../_utils/bed-form-schema';
import { MANUAL_BED_STATUS_OPTIONS } from '../../_utils/bed-status';

const NO_ROOM = 'none';

const EMPTY_FORM: BedFormValues = {
  bedNumber: '',
  wardId: '',
  roomId: NO_ROOM,
  status: 'AVAILABLE',
  notes: '',
};

export function BedFormSheet({
  open,
  bed,
  isCreating,
  onClose,
}: {
  open: boolean;
  bed: Bed | null;
  isCreating: boolean;
  onClose: () => void;
}) {
  const form = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateBed();
  const updateMutation = useUpdateBed();
  const wardsQuery = useWardsQuery({ page: 1, limit: 999 });
  const roomsQuery = useRoomsQuery({ page: 1, limit: 999 });
  const wards = wardsQuery.data?.data ?? [];
  const rooms = roomsQuery.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    control,
    register,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      bed
        ? {
            bedNumber: bed.bedNumber,
            wardId: String(bed.wardId),
            roomId: bed.roomId !== null ? String(bed.roomId) : NO_ROOM,
            status: bed.status === 'OCCUPIED' ? 'AVAILABLE' : bed.status,
            notes: bed.notes ?? '',
          }
        : EMPTY_FORM
    );
  }, [open, bed, reset]);

  const handleSave = form.handleSubmit(async (values) => {
    const request = {
      bedNumber: values.bedNumber,
      wardId: Number(values.wardId),
      roomId: values.roomId !== NO_ROOM ? Number(values.roomId) : null,
      status: values.status,
      notes: values.notes || undefined,
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Bed created.');
      } else if (bed) {
        await updateMutation.mutateAsync({ id: bed.id, request });
        toast.success('Bed updated.');
      }

      onClose();
    } catch (error) {
      // Map the server's field conflicts back onto the inputs that caused them.
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Bed number')) {
          setError('bedNumber', { message });
        } else if (message.startsWith('Ward')) {
          setError('wardId', { message });
        } else if (message.startsWith('Room')) {
          setError('roomId', { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  const serverErrors = getApiErrors(createMutation.error ?? updateMutation.error);

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Bed' : `Edit ${bed?.bedNumber ?? 'Bed'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a Bed inside a Ward, optionally locating it in a physical Room.'
              : 'Update the Bed details. An occupied Bed cannot be edited.'}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup>
              {serverErrors.length > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Could not save the Bed</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {serverErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Field data-invalid={Boolean(errors.bedNumber)}>
                <FieldLabel htmlFor="bed-number">
                  Bed number{' '}
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="bed-number"
                  aria-required
                  placeholder="ICU-01"
                  {...register('bedNumber')}
                />
                {errors.bedNumber ? (
                  <FieldError>{errors.bedNumber.message}</FieldError>
                ) : (
                  <p className="text-muted-foreground text-xs">Unique within the Ward.</p>
                )}
              </Field>

              <Controller
                control={control}
                name="wardId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.wardId)}>
                    <FieldLabel htmlFor="bed-ward">
                      Ward{' '}
                      <span aria-hidden className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="bed-ward" aria-required className="w-full">
                        <SelectValue placeholder="Select a Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={String(ward.id)}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.wardId ? <FieldError>{errors.wardId.message}</FieldError> : null}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="roomId"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.roomId)}>
                    <FieldLabel htmlFor="bed-room">Room</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="bed-room" className="w-full">
                        <SelectValue placeholder="No Room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ROOM}>No Room</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={String(room.id)}>
                            {room.roomNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.roomId ? <FieldError>{errors.roomId.message}</FieldError> : null}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.status)}>
                    <FieldLabel htmlFor="bed-status">Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="bed-status" className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUAL_BED_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                      Occupied is set automatically when a Patient is admitted to the Bed.
                    </p>
                    {errors.status ? <FieldError>{errors.status.message}</FieldError> : null}
                  </Field>
                )}
              />

              <Field data-invalid={Boolean(errors.notes)}>
                <FieldLabel htmlFor="bed-notes">Notes</FieldLabel>
                <Textarea
                  id="bed-notes"
                  rows={3}
                  placeholder="Near the nursing station"
                  {...register('notes')}
                />
                {errors.notes ? <FieldError>{errors.notes.message}</FieldError> : null}
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="size-4" />
              {isSaving ? 'Saving…' : isCreating ? 'Create Bed' : 'Save changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
