'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateDoctorSchedule } from '@/app/queries/doctor-schedules/useCreateDoctorSchedule';
import { useUpdateDoctorSchedule } from '@/app/queries/doctor-schedules/useUpdateDoctorSchedule';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

import {
  doctorScheduleFormSchema,
  type DoctorScheduleFormValues,
} from '../../_utils/doctor-schedule-form-schema';

const EMPTY_DEFAULTS: DoctorScheduleFormValues = {
  doctorId: '',
  rotaIds: [],
  slotToDate: '',
  slotFromDate: '',
  slotInMinute: '30',
};

type DoctorScheduleFormSheetProps = {
  open: boolean;
  onClose: () => void;
  doctors: Doctor[];
  rotas: DoctorRota[];
  mode: 'new' | 'edit';
  doctorsLoading: boolean;
  rotasLoading: boolean;
  scheduleResolving: boolean;
  schedule: DoctorSchedule | null;
};

function toDefaults(schedule: DoctorSchedule | null): DoctorScheduleFormValues {
  if (!schedule) {
    return EMPTY_DEFAULTS;
  }

  return {
    doctorId: String(schedule.doctorId),
    rotaIds: schedule.rotaDetails.map((rota) => rota.rotaId),
    slotToDate: schedule.slotToDate,
    slotFromDate: schedule.slotFromDate,
    slotInMinute: String(schedule.slotDurationMinutes),
  };
}

function diffIds(previousIds: number[], nextIds: number[]) {
  const previous = new Set(previousIds);
  const next = new Set(nextIds);

  return {
    added: nextIds.filter((id) => !previous.has(id)),
    removed: previousIds.filter((id) => !next.has(id)),
  };
}

export function DoctorScheduleFormSheet({
  open,
  mode,
  rotas,
  doctors,
  onClose,
  schedule,
  rotasLoading,
  doctorsLoading,
  scheduleResolving,
}: DoctorScheduleFormSheetProps) {
  const createMutation = useCreateDoctorSchedule();
  const updateMutation = useUpdateDoctorSchedule();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<DoctorScheduleFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(doctorScheduleFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : schedule ? String(schedule.id) : null;

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (sessionKey === null) {
      return;
    }

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    form.reset(toDefaults(schedule));
  }, [form, open, schedule, sessionKey]);

  const selectedRotaIds = useWatch({ control: form.control, name: 'rotaIds' });
  const selectedRotaCount = selectedRotaIds.length;
  const showSkeleton = scheduleResolving || doctorsLoading || rotasLoading;

  const sheetTitle = isCreating ? 'New Doctor Schedule' : 'Edit Doctor Schedule';
  const sheetDescription = isCreating
    ? 'Assign Doctor Rotas over a date range and slot duration.'
    : 'Update the Doctor, assigned Rotas, date range, or slot duration.';

  const rotaSummary = useMemo(() => {
    if (selectedRotaCount === 0) {
      return 'No Doctor Rotas selected';
    }

    return `${selectedRotaCount} ${selectedRotaCount === 1 ? 'Doctor Rota' : 'Doctor Rotas'} selected`;
  }, [selectedRotaCount]);

  const onSubmit = form.handleSubmit(async (values) => {
    const doctorId = Number(values.doctorId);
    const slotInMinute = Number(values.slotInMinute);
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          doctorId,
          rotaIds: values.rotaIds,
          slotInMinute,
          slotToDate: values.slotToDate,
          slotFromDate: values.slotFromDate,
        });
        toast.success('Doctor Schedule created.');
        onClose();
        return;
      }

      if (!schedule) {
        return;
      }

      const previousRotaIds = schedule.rotaDetails.map((rota) => rota.rotaId);
      const { added, removed } = diffIds(previousRotaIds, values.rotaIds);

      await updateMutation.mutateAsync({
        doctorId,
        slotInMinute,
        doctorScheduleId: schedule.id,
        slotToDate: values.slotToDate,
        slotFromDate: values.slotFromDate,
      });

      if (removed.length > 0) {
        await updateMutation.mutateAsync({
          rotaType: 'remove',
          rotaIds: removed,
          doctorScheduleId: schedule.id,
        });
      }

      if (added.length > 0) {
        await updateMutation.mutateAsync({
          rotaType: 'new',
          rotaIds: added,
          doctorScheduleId: schedule.id,
        });
      }

      toast.success('Doctor Schedule updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        onPointerDownOutside={(event) => event.preventDefault()}
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {showSkeleton ? (
          <div className="flex-1 space-y-4 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <form id="doctor-schedule-form" onSubmit={onSubmit} className="space-y-5 p-4">
                {serverErrors.length > 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Save failed</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-4">
                        {serverErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <FieldGroup className="gap-4">
                  <Controller
                    control={form.control}
                    name="doctorId"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="doctor-schedule-doctor">
                          Doctor{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <NativeSelect
                          id="doctor-schedule-doctor"
                          value={field.value}
                          disabled={isSaving}
                          aria-required={true}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <NativeSelectOption value="">Select Doctor</NativeSelectOption>
                          {doctors.map((doctor) => (
                            <NativeSelectOption key={doctor.id} value={String(doctor.id)}>
                              {doctor.name}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        {fieldState.error ? (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
                        ) : null}
                      </Field>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="slotFromDate"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="doctor-schedule-from-date">
                            Slot from date{' '}
                            <span aria-hidden="true" className="text-destructive">
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id="doctor-schedule-from-date"
                            type="date"
                            {...field}
                            disabled={isSaving}
                            aria-required={true}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.error ? (
                            <p className="text-destructive text-xs">{fieldState.error.message}</p>
                          ) : null}
                        </Field>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="slotToDate"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="doctor-schedule-to-date">
                            Slot to date{' '}
                            <span aria-hidden="true" className="text-destructive">
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id="doctor-schedule-to-date"
                            type="date"
                            {...field}
                            disabled={isSaving}
                            aria-required={true}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.error ? (
                            <p className="text-destructive text-xs">{fieldState.error.message}</p>
                          ) : null}
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    control={form.control}
                    name="slotInMinute"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="doctor-schedule-duration">
                          Slot duration in minutes{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id="doctor-schedule-duration"
                          type="number"
                          min={1}
                          max={1440}
                          step={1}
                          {...field}
                          disabled={isSaving}
                          aria-required={true}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error ? (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
                        ) : null}
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="rotaIds"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>
                          Doctor Rotas{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <div className="rounded-lg border">
                          {rotas.length === 0 ? (
                            <p className="text-muted-foreground p-3 text-sm">
                              No Doctor Rotas are available yet.
                            </p>
                          ) : (
                            <div className="divide-y">
                              {rotas.map((rota) => {
                                const checked = field.value.includes(rota.id);

                                return (
                                  <label
                                    key={rota.id}
                                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-3"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      disabled={isSaving}
                                      aria-label={`Select ${rota.name}`}
                                      onCheckedChange={(nextChecked) => {
                                        field.onChange(
                                          nextChecked === true
                                            ? [...field.value, rota.id]
                                            : field.value.filter((id) => id !== rota.id)
                                        );
                                      }}
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block font-medium">{rota.name}</span>
                                      <span className="text-muted-foreground block text-xs">
                                        {rota.fromTime} to {rota.toTime}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">{rotaSummary}</p>
                        {fieldState.error ? (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
                        ) : null}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </ScrollArea>

            <SheetFooter className="border-t p-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="doctor-schedule-form"
                disabled={isSaving || rotas.length === 0}
              >
                <Save className="size-4" />
                {isSaving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
