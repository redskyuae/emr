'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';

import { computeBmi } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { useCreatePatientVitalSign } from '@/app/queries/patients/chart/useCreatePatientVitalSign';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  toOptionalNumber,
  visitVitalsFormSchema,
  type VisitVitalsFormValues,
} from '../../_utils/visit-capture-form-schema';

const EMPTY: VisitVitalsFormValues = {
  heightCm: '',
  weightKg: '',
  systolic: '',
  diastolic: '',
  pulseBpm: '',
  respRate: '',
  temperatureC: '',
  spo2: '',
  painScore: '',
  notes: '',
};

const MEASUREMENT_GROUPS = [
  {
    title: 'Circulation',
    items: [
      { name: 'systolic', label: 'Systolic', unit: 'mmHg' },
      { name: 'diastolic', label: 'Diastolic', unit: 'mmHg' },
      { name: 'pulseBpm', label: 'Pulse', unit: 'bpm' },
    ],
  },
  {
    title: 'Breathing and temperature',
    items: [
      { name: 'respRate', label: 'Respiratory rate', unit: '/min' },
      { name: 'spo2', label: 'SpO₂', unit: '%' },
      { name: 'temperatureC', label: 'Temperature', unit: '°C' },
    ],
  },
  {
    title: 'Body and pain',
    items: [
      { name: 'heightCm', label: 'Height', unit: 'cm' },
      { name: 'weightKg', label: 'Weight', unit: 'kg' },
      { name: 'painScore', label: 'Pain score', unit: '/10' },
    ],
  },
] as const;

export function RecordVitalsSheet({
  open,
  patientId,
  visitId,
  onClose,
}: {
  open: boolean;
  patientId: number;
  visitId: number;
  onClose: () => void;
}) {
  const form = useForm<VisitVitalsFormValues>({
    resolver: zodResolver(visitVitalsFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const createVitals = useCreatePatientVitalSign();
  const [heightCm, weightKg] = useWatch({
    control: form.control,
    name: ['heightCm', 'weightKg'],
  });
  const bmi = computeBmi(toOptionalNumber(heightCm), toOptionalNumber(weightKg));

  useEffect(() => {
    if (open) {
      form.reset(EMPTY);
    }
  }, [open, form]);

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await createVitals.mutateAsync({
        patientId,
        body: {
          // Stamping the Visit is what makes this an in-visit observation
          // rather than a standalone one on the chart.
          visitId,
          heightCm: toOptionalNumber(values.heightCm),
          weightKg: toOptionalNumber(values.weightKg),
          systolic: toOptionalNumber(values.systolic),
          diastolic: toOptionalNumber(values.diastolic),
          pulseBpm: toOptionalNumber(values.pulseBpm),
          respRate: toOptionalNumber(values.respRate),
          temperatureC: toOptionalNumber(values.temperatureC),
          spo2: toOptionalNumber(values.spo2),
          painScore: toOptionalNumber(values.painScore),
          notes: values.notes || undefined,
        },
      });
      toast.success('Vitals recorded.');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(560px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">Record vitals</SheetTitle>
          <SheetDescription>
            Captured against this Visit. Record at least one measurement; BMI is computed for you.
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
              {MEASUREMENT_GROUPS.map((group) => (
                <fieldset key={group.title} className="space-y-3">
                  <legend className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {group.title}
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {group.items.map((measurement) => (
                      <Field
                        key={measurement.name}
                        data-invalid={Boolean(form.formState.errors[measurement.name])}
                      >
                        <FieldLabel htmlFor={measurement.name}>{measurement.label}</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id={measurement.name}
                            inputMode="decimal"
                            aria-invalid={Boolean(form.formState.errors[measurement.name])}
                            className="font-mono tabular-nums"
                            {...form.register(measurement.name)}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>{measurement.unit}</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {form.formState.errors[measurement.name] ? (
                          <FieldError>
                            {form.formState.errors[measurement.name]?.message}
                          </FieldError>
                        ) : null}
                      </Field>
                    ))}
                  </div>
                </fieldset>
              ))}

              <p className="text-muted-foreground text-sm" role="status">
                BMI{' '}
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {bmi ?? '—'}
                </span>
                {bmi === undefined ? ' · enter height and weight' : ''}
              </p>

              <Field>
                <FieldLabel htmlFor="vitals-notes">Notes</FieldLabel>
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <RichTextEditor
                      id="vitals-notes"
                      aria-label="Notes"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createVitals.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createVitals.isPending}>
              <Activity className="size-4" />
              {createVitals.isPending ? 'Saving…' : 'Record vitals'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
