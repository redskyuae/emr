'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateRoomType } from '@/app/queries/room-masters/room-types/useCreateRoomType';
import { useUpdateRoomType } from '@/app/queries/room-masters/room-types/useUpdateRoomType';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { roomTypeFormSchema, type RoomTypeFormValues } from '../../_utils/room-type-form-schema';

const DEFAULT_COLOR = '#2563EB';

const EMPTY_DEFAULTS: RoomTypeFormValues = {
  name: '',
  code: '',
  color: DEFAULT_COLOR,
  dailyRate: '',
  description: '',
};

type RoomTypeFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  roomTypeId: number | null;
  roomType: RoomType | null;
  isResolving: boolean;
  onClose: () => void;
};

export function RoomTypeFormSheet({
  open,
  mode,
  roomTypeId,
  roomType,
  isResolving,
  onClose,
}: RoomTypeFormSheetProps) {
  const createMutation = useCreateRoomType();
  const updateMutation = useUpdateRoomType();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<RoomTypeFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(roomTypeFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : roomTypeId === null ? null : String(roomTypeId);

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
      name: roomType?.name ?? '',
      code: roomType?.code ?? '',
      color: roomType?.color ?? DEFAULT_COLOR,
      dailyRate:
        roomType?.dailyRate === null || roomType === null ? '' : String(roomType.dailyRate),
      description: roomType?.description ?? '',
    });
  }, [open, sessionKey, isResolving, roomType, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request = {
      name: values.name,
      code: values.code,
      color: values.color,
      dailyRate: values.dailyRate === '' ? undefined : Number(values.dailyRate),
      description: values.description.trim(),
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('Room Type created.');
        onClose();
        return;
      }

      if (roomTypeId === null) {
        return;
      }

      await updateMutation.mutateAsync({ id: roomTypeId, request });
      toast.success('Room Type updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Room Type' : `Edit ${roomType?.name ?? 'Room Type'}`;
  const sheetDescription = isCreating
    ? 'Create a new Tenant-scoped Room Type.'
    : 'Update the Room Type details.';

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
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id="room-type-form"
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
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

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-type-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="room-type-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Private Room"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-type-code">
                        Code{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="room-type-code"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        disabled={isSaving}
                        maxLength={10}
                        placeholder="e.g. PVT"
                        className="font-mono"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => {
                    const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(field.value);

                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="room-type-color">
                          Color{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <label
                          aria-label="Pick a color"
                          className="flex w-fit cursor-pointer items-center gap-2"
                          title="Pick a color"
                        >
                          <span
                            className="border-input block size-9 shrink-0 rounded-md border"
                            style={{ backgroundColor: isValidHex ? field.value : DEFAULT_COLOR }}
                          />
                          <span className="text-muted-foreground text-sm">
                            Click to choose color
                          </span>
                          <input
                            id="room-type-color"
                            type="color"
                            className="sr-only"
                            value={isValidHex ? field.value : DEFAULT_COLOR}
                            onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                            disabled={isSaving}
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                          />
                        </label>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    );
                  }}
                />

                <Controller
                  control={form.control}
                  name="dailyRate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-type-daily-rate">Daily rate</FieldLabel>
                      <Input
                        id="room-type-daily-rate"
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        disabled={isSaving}
                        placeholder="e.g. 4500.00"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="room-type-description">Description</FieldLabel>
                      <Textarea
                        id="room-type-description"
                        {...field}
                        disabled={isSaving}
                        rows={3}
                        placeholder="Optional description"
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
              <Button type="submit" form="room-type-form" disabled={isSaving} aria-busy={isSaving}>
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
