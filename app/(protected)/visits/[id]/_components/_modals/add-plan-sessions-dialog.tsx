'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CiWarning } from 'react-icons/ci';
import { PiPlusLight } from 'react-icons/pi';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
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
  addPlanSessionsFormSchema,
  type AddPlanSessionsFormInput,
  type AddPlanSessionsFormValues,
} from '../../_utils/add-plan-sessions-form-schema';

/** Extends one current Patient Treatment Plan with more Sessions. */
export function AddPlanSessionsDialog({
  patientId,
  plan,
  onClose,
}: {
  patientId: number;
  plan: PatientTreatmentPlan;
  onClose: () => void;
}) {
  const form = useForm<AddPlanSessionsFormInput, unknown, AddPlanSessionsFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(addPlanSessionsFormSchema),
    defaultValues: { sessions: '1' },
  });
  const addSessions = useAddPatientTreatmentPlanSessions({
    onSuccess: (_response, { request }) => {
      toast.success(`${request.sessions} Session${request.sessions === 1 ? '' : 's'} added.`);
      onClose();
    },
  });

  async function save(values: AddPlanSessionsFormValues) {
    form.clearErrors('root');

    try {
      await addSessions.mutateAsync({
        patientId,
        request: { patientTreatmentPlanId: plan.id, sessions: values.sessions },
      });
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
      <DialogContent className="shadow-fluent-64 min-w-0 sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle>Add Sessions</DialogTitle>
          <DialogDescription>
            Extend {plan.treatmentName}. New Sessions use the Plan&apos;s assigned clinical details
            and continue after Session {plan.totalSessions}.
          </DialogDescription>
        </DialogHeader>

        <form className="contents" onSubmit={form.handleSubmit(save)}>
          <p className="text-muted-foreground text-sm">
            {plan.completedSessions} completed · {plan.totalSessions} currently planned
          </p>

          <Controller
            control={form.control}
            name="sessions"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="add-plan-sessions">
                  Sessions{' '}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id="add-plan-sessions"
                  type="number"
                  min={1}
                  max={100}
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
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {form.formState.errors.root?.message ? (
            <Alert variant="destructive">
              <CiWarning className="size-4" />
              <AlertTitle>Sessions not added</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
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
              disabled={addSessions.isPending}
              aria-busy={addSessions.isPending}
            >
              <PiPlusLight className="size-4" />
              {addSessions.isPending ? 'Saving…' : 'Add Sessions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
