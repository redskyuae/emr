'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateTherapistSchedule } from '@/app/queries/therapist-schedules/useCreateTherapistSchedule';
import { useUpdateTherapistSchedule } from '@/app/queries/therapist-schedules/useUpdateTherapistSchedule';
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
  therapistScheduleFormSchema,
  type TherapistScheduleFormValues,
} from '../../_utils/therapist-schedule-form-schema';

const EMPTY_DEFAULTS: TherapistScheduleFormValues = {
  rotaIds: [],
  therapistId: '',
  slotToDate: '',
  slotFromDate: '',
  slotInMinute: '30',
};

type Props = {
  open: boolean;
  onClose: () => void;
  rotas: DoctorRota[];
  therapists: Therapist[];
  mode: 'new' | 'edit';
  rotasLoading: boolean;
  therapistsLoading: boolean;
  scheduleResolving: boolean;
  schedule: TherapistSchedule | null;
};

function toDefaults(schedule: TherapistSchedule | null): TherapistScheduleFormValues {
  return schedule
    ? {
        therapistId: String(schedule.therapistId),
        rotaIds: schedule.rotaDetails.map(({ rotaId }) => rotaId),
        slotToDate: schedule.slotToDate,
        slotFromDate: schedule.slotFromDate,
        slotInMinute: String(schedule.slotDurationMinutes),
      }
    : EMPTY_DEFAULTS;
}

function diffIds(previousIds: number[], nextIds: number[]) {
  const previous = new Set(previousIds);
  const next = new Set(nextIds);
  return {
    added: nextIds.filter((id) => !previous.has(id)),
    removed: previousIds.filter((id) => !next.has(id)),
  };
}

export function TherapistScheduleFormSheet({
  open,
  mode,
  rotas,
  onClose,
  schedule,
  therapists,
  rotasLoading,
  therapistsLoading,
  scheduleResolving,
}: Props) {
  const createMutation = useCreateTherapistSchedule();
  const updateMutation = useUpdateTherapistSchedule();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);
  const form = useForm<TherapistScheduleFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(therapistScheduleFormSchema),
  });
  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : schedule ? String(schedule.id) : null;

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }
    if (sessionKey === null || initializedKeyRef.current === sessionKey) return;
    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    form.reset(toDefaults(schedule));
  }, [form, open, schedule, sessionKey]);

  const selectedRotaIds = useWatch({ control: form.control, name: 'rotaIds' });
  const rotaSummary = useMemo(
    () =>
      selectedRotaIds.length === 0
        ? 'No Rotas selected'
        : `${selectedRotaIds.length} ${selectedRotaIds.length === 1 ? 'Rota' : 'Rotas'} selected`,
    [selectedRotaIds.length]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);
    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          therapistId: Number(values.therapistId),
          rotaIds: values.rotaIds,
          slotInMinute: Number(values.slotInMinute),
          slotToDate: values.slotToDate,
          slotFromDate: values.slotFromDate,
        });
        toast.success('Therapist Schedule created.');
      } else if (schedule) {
        const { added, removed } = diffIds(
          schedule.rotaDetails.map(({ rotaId }) => rotaId),
          values.rotaIds
        );
        await updateMutation.mutateAsync({
          therapistScheduleId: schedule.id,
          therapistId: Number(values.therapistId),
          slotInMinute: Number(values.slotInMinute),
          slotToDate: values.slotToDate,
          slotFromDate: values.slotFromDate,
        });
        if (removed.length)
          await updateMutation.mutateAsync({
            therapistScheduleId: schedule.id,
            rotaIds: removed,
            rotaType: 'remove',
          });
        if (added.length)
          await updateMutation.mutateAsync({
            therapistScheduleId: schedule.id,
            rotaIds: added,
            rotaType: 'new',
          });
        toast.success('Therapist Schedule updated.');
      }
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const showSkeleton = scheduleResolving || therapistsLoading || rotasLoading;
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        onPointerDownOutside={(event) => event.preventDefault()}
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'New Therapist Schedule' : 'Edit Therapist Schedule'}
          </SheetTitle>
          <SheetDescription>
            Assign Rotas to a Therapist over a date range and choose the availability slot duration.
          </SheetDescription>
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
              <form id="therapist-schedule-form" onSubmit={onSubmit} className="space-y-5 p-4">
                {serverErrors.length ? (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>Save failed</AlertTitle>
                    <AlertDescription>{serverErrors.join(' ')}</AlertDescription>
                  </Alert>
                ) : null}
                <FieldGroup className="gap-4">
                  <Controller
                    control={form.control}
                    name="therapistId"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="therapist-schedule-therapist">
                          Therapist{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <NativeSelect
                          id="therapist-schedule-therapist"
                          value={field.value}
                          disabled={isSaving}
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <NativeSelectOption value="">Select Therapist</NativeSelectOption>
                          {therapists.map((therapist) => (
                            <NativeSelectOption key={therapist.id} value={String(therapist.id)}>
                              {therapist.name}
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
                    {(['slotFromDate', 'slotToDate'] as const).map((name) => (
                      <Controller
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field, fieldState }) => (
                          <Field>
                            <FieldLabel htmlFor={`therapist-schedule-${name}`}>
                              {name === 'slotFromDate' ? 'Slot from date' : 'Slot to date'}{' '}
                              <span aria-hidden="true" className="text-destructive">
                                *
                              </span>
                            </FieldLabel>
                            <Input
                              id={`therapist-schedule-${name}`}
                              type="date"
                              {...field}
                              disabled={isSaving}
                              aria-required="true"
                              aria-invalid={fieldState.invalid}
                            />
                            {fieldState.error ? (
                              <p className="text-destructive text-xs">{fieldState.error.message}</p>
                            ) : null}
                          </Field>
                        )}
                      />
                    ))}
                  </div>
                  <Controller
                    control={form.control}
                    name="slotInMinute"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="therapist-schedule-duration">
                          Slot duration in minutes{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id="therapist-schedule-duration"
                          type="number"
                          min={1}
                          max={1440}
                          step={1}
                          {...field}
                          disabled={isSaving}
                          aria-required="true"
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
                          Rotas{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <div className="divide-y rounded-lg border">
                          {rotas.map((rota) => (
                            <label
                              key={rota.id}
                              className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-3"
                            >
                              <Checkbox
                                checked={field.value.includes(rota.id)}
                                disabled={isSaving}
                                aria-label={`Select ${rota.name}`}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked === true
                                      ? [...field.value, rota.id]
                                      : field.value.filter((id) => id !== rota.id)
                                  )
                                }
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{rota.name}</span>
                                <span className="text-muted-foreground block text-xs">
                                  {rota.fromTime} to {rota.toTime}
                                </span>
                              </span>
                            </label>
                          ))}
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
                form="therapist-schedule-form"
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
