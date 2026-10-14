'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, TriangleAlert } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
  addTreatmentPlanSessionsFormSchema,
  type AddTreatmentPlanSessionsFormInput,
  type AddTreatmentPlanSessionsFormValues,
} from '@/app/(protected)/appointments/new/_utils/add-treatment-plan-sessions-form-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAddPatientTreatmentPlanSessions } from '@/app/queries/patient-treatment-plans/useAddPatientTreatmentPlanSessions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BookingTreatment } from '../book-appointment-demo-data';

export function AddTreatmentPlanSessionsDialog({
  patientId,
  plans,
  initialPlanId,
  onClose,
}: {
  patientId: number;
  plans: BookingTreatment[];
  initialPlanId: number | null;
  onClose: () => void;
}) {
  const defaultPlan =
    plans.find((plan) => plan.patientTreatmentPlanId === initialPlanId) ?? plans[0] ?? null;
  const form = useForm<
    AddTreatmentPlanSessionsFormInput,
    unknown,
    AddTreatmentPlanSessionsFormValues
  >({
    mode: 'onTouched',
    resolver: zodResolver(addTreatmentPlanSessionsFormSchema),
    defaultValues: {
      patientTreatmentPlanId: defaultPlan ? String(defaultPlan.patientTreatmentPlanId) : '',
      sessions: '1',
    },
  });
  const selectedPlanId = useWatch({
    control: form.control,
    name: 'patientTreatmentPlanId',
  });
  const selectedPlan = plans.find((plan) => String(plan.patientTreatmentPlanId) === selectedPlanId);
  const addSessions = useAddPatientTreatmentPlanSessions({
    onSuccess: (_response, variables) => {
      toast.success(
        `${variables.request.sessions} Session${variables.request.sessions === 1 ? '' : 's'} added.`
      );
      onClose();
    },
  });

  async function save(values: AddTreatmentPlanSessionsFormValues) {
    form.clearErrors('root');

    try {
      await addSessions.mutateAsync({ patientId, request: values });
    } catch (error) {
      const message = getApiErrorMessage(error);
      form.setError('root', { type: 'server', message });
      toast.error(message);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !addSessions.isPending) onClose();
      }}
    >
      <DialogContent className="shadow-fluent-64 min-w-0 overflow-hidden sm:max-w-lg">
        <DialogHeader className="min-w-0">
          <DialogTitle>Add Sessions</DialogTitle>
          <DialogDescription>
            Extend a current Patient Treatment Plan. New Sessions use its assigned clinical details
            and continue the existing Session numbering.
          </DialogDescription>
        </DialogHeader>

        <form className="contents" onSubmit={form.handleSubmit(save)}>
          <Controller
            control={form.control}
            name="patientTreatmentPlanId"
            render={({ field, fieldState }) => (
              <Field className="min-w-0" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-sessions-treatment-plan">
                  Treatment Plan <RequiredMark />
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.clearErrors('root');
                  }}
                  disabled={addSessions.isPending}
                >
                  <SelectTrigger
                    id="add-sessions-treatment-plan"
                    className="w-full max-w-full min-w-0"
                    aria-required="true"
                    aria-invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                  >
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left"
                      placeholder="Select a Treatment Plan"
                    />
                  </SelectTrigger>
                  <SelectContent className="w-[calc(100vw-4rem)] max-w-none sm:w-120">
                    {plans.map((plan) => (
                      <SelectItem
                        key={plan.patientTreatmentPlanId}
                        value={String(plan.patientTreatmentPlanId)}
                      >
                        <span className="block min-w-0 truncate">
                          {plan.name} · {plan.code} · {plan.plannedSessions} Sessions
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlan ? (
                  <p className="text-muted-foreground text-xs">
                    {selectedPlan.completedSessions} completed · {selectedPlan.plannedSessions}{' '}
                    currently planned
                  </p>
                ) : null}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="sessions"
            render={({ field, fieldState }) => (
              <Field className="min-w-0" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="additional-sessions">
                  Sessions <RequiredMark />
                </FieldLabel>
                <Input
                  {...field}
                  id="additional-sessions"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  disabled={addSessions.isPending}
                  aria-required="true"
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => {
                    field.onChange(event);
                    form.clearErrors('root');
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  Enter the number of Sessions to add after the existing Sessions.
                </p>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {form.formState.errors.root?.message ? (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertTitle>Sessions not added</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="min-w-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addSessions.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addSessions.isPending || plans.length === 0}
              aria-busy={addSessions.isPending}
            >
              <Plus className="size-4" />
              {addSessions.isPending ? 'Saving…' : 'Save Sessions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}
