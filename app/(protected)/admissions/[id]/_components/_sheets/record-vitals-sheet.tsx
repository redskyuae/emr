'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCreatePatientVitalSign } from '@/app/queries/patients/chart/useCreatePatientVitalSign';
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
import {
  toOptionalNumber,
  admissionVitalsFormSchema,
  type AdmissionVitalsFormValues,
} from '../../_utils/admission-capture-form-schema';

const EMPTY: AdmissionVitalsFormValues = {
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

const MEASUREMENTS = [
  { name: 'systolic', label: 'Systolic (mmHg)' },
  { name: 'diastolic', label: 'Diastolic (mmHg)' },
  { name: 'pulseBpm', label: 'Pulse (bpm)' },
  { name: 'respRate', label: 'Respiratory rate' },
  { name: 'temperatureC', label: 'Temperature (°C)' },
  { name: 'spo2', label: 'SpO₂ (%)' },
  { name: 'heightCm', label: 'Height (cm)' },
  { name: 'weightKg', label: 'Weight (kg)' },
  { name: 'painScore', label: 'Pain score (0–10)' },
] as const;

export function RecordVitalsSheet({
  open,
  patientId,
  admissionId,
  onClose,
}: {
  open: boolean;
  patientId: number;
  admissionId: number;
  onClose: () => void;
}) {
  const form = useForm<AdmissionVitalsFormValues>({
    resolver: zodResolver(admissionVitalsFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const createVitals = useCreatePatientVitalSign();

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
          // Stamping the Admission is what makes this an in-admission observation
          // rather than a standalone one on the chart.
          admissionId,
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
            Captured against this Admission. Record at least one measurement; BMI is computed for
            you.
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
              <div className="grid grid-cols-2 gap-3">
                {MEASUREMENTS.map((measurement) => (
                  <Field
                    key={measurement.name}
                    data-invalid={Boolean(form.formState.errors[measurement.name])}
                  >
                    <FieldLabel htmlFor={measurement.name}>{measurement.label}</FieldLabel>
                    <Input
                      id={measurement.name}
                      inputMode="decimal"
                      {...form.register(measurement.name)}
                    />
                    {form.formState.errors[measurement.name] ? (
                      <FieldError>{form.formState.errors[measurement.name]?.message}</FieldError>
                    ) : null}
                  </Field>
                ))}
              </div>

              <Field>
                <FieldLabel htmlFor="vitals-notes">Notes</FieldLabel>
                <Textarea id="vitals-notes" rows={2} {...form.register('notes')} />
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
