'use client';

import { useRef, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { Treatment } from '@/app/api/lib/modules/treatment/schemas/treatment-schema';
import { getApiErrors } from '@/app/queries/api-error';
import { useAssignPatientTreatmentPlan } from '@/app/queries/patient-treatment-plans/useAssignPatientTreatmentPlan';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  assignTreatmentPlanFormSchema,
  type AssignTreatmentPlanFormValues,
} from '../../_utils/assign-treatment-plan-form-schema';

const EMPTY: AssignTreatmentPlanFormValues = {
  treatmentId: '',
  totalSessions: '',
  additionalSessions: '0',
};

export function AssignTreatmentPlanSheet({
  open,
  patientId,
  onClose,
}: {
  open: boolean;
  patientId: number;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const treatmentsQuery = useTreatmentsQuery(
    { query: debouncedSearch || undefined, page: 1, limit: 100 },
    { enabled: open }
  );
  const assign = useAssignPatientTreatmentPlan();
  const form = useForm<AssignTreatmentPlanFormValues>({
    resolver: zodResolver(assignTreatmentPlanFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const treatments = treatmentsQuery.data?.data ?? [];
  const treatmentOptions =
    selectedTreatment && !treatments.some((item) => item.id === selectedTreatment.id)
      ? [selectedTreatment, ...treatments]
      : treatments;

  const submit = form.handleSubmit(async (values) => {
    if (!selectedTreatment) {
      form.setError('treatmentId', { message: 'Select a Treatment.' });
      return;
    }
    if (selectedTreatment.sessionStructure === 'REPEATABLE' && !values.totalSessions) {
      form.setError('totalSessions', { message: 'Number of Sessions is required.' });
      return;
    }
    setServerErrors([]);
    try {
      await assign.mutateAsync({
        patientId,
        request: {
          treatmentId: selectedTreatment.id,
          ...(selectedTreatment.sessionStructure === 'REPEATABLE'
            ? { totalSessions: Number(values.totalSessions) }
            : { additionalSessions: Number(values.additionalSessions) }),
        },
      });
      toast.success('Patient Treatment Plan assigned.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
    }
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (!next && !assign.isPending ? onClose() : undefined)}
    >
      <SheetContent
        ref={sheetRef}
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(620px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle>Assign Patient Treatment Plan</SheetTitle>
          <SheetDescription>
            Select a Treatment Master. Its Session templates are copied to this Patient&apos;s Plan.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {serverErrors.length > 0 ? (
              <Alert variant="destructive">
                <AlertTitle>Could not assign Treatment Plan</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {serverErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
            <Controller
              control={form.control}
              name="treatmentId"
              render={({ field }) => (
                <Field data-invalid={Boolean(form.formState.errors.treatmentId)}>
                  <FieldLabel htmlFor="assign-treatment">
                    Treatment{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Combobox<Treatment>
                    items={treatmentOptions}
                    value={selectedTreatment}
                    itemToStringLabel={(item) => `${item.name} · ${item.code}`}
                    itemToStringValue={(item) => String(item.id)}
                    onValueChange={(treatment) => {
                      field.onChange(treatment ? String(treatment.id) : '');
                      setSelectedTreatment(treatment);
                      form.setValue(
                        'totalSessions',
                        treatment?.defaultTotalSessions
                          ? String(treatment.defaultTotalSessions)
                          : ''
                      );
                      form.setValue('additionalSessions', '0');
                      form.clearErrors(['treatmentId', 'totalSessions', 'additionalSessions']);
                    }}
                    onInputValueChange={setSearch}
                  >
                    <ComboboxInput
                      id="assign-treatment"
                      className="w-full"
                      placeholder="Search Treatment name or code"
                      aria-required="true"
                      aria-invalid={Boolean(form.formState.errors.treatmentId)}
                      onBlur={field.onBlur}
                      showClear
                    />
                    <ComboboxContent portalContainer={sheetRef}>
                      <ComboboxEmpty>
                        {treatmentsQuery.isFetching
                          ? 'Searching Treatments…'
                          : 'No Treatments found.'}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {treatmentOptions.map((treatment) => (
                          <ComboboxItem key={treatment.id} value={treatment}>
                            <span>
                              <span className="block font-medium">{treatment.name}</span>
                              <span className="text-muted-foreground block font-mono text-xs">
                                {treatment.code}
                              </span>
                            </span>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {form.formState.errors.treatmentId ? (
                    <FieldError>{form.formState.errors.treatmentId.message}</FieldError>
                  ) : null}
                  {treatmentsQuery.isError ? (
                    <p className="text-destructive text-sm">Treatments could not be loaded.</p>
                  ) : null}
                  <p className="text-muted-foreground text-xs" aria-live="polite">
                    {treatmentsQuery.isFetching
                      ? 'Searching Treatments…'
                      : 'Search within the dropdown to find a Treatment.'}
                  </p>
                </Field>
              )}
            />
            {selectedTreatment ? (
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <p className="font-medium">{selectedTreatment.name}</p>
                <p className="text-muted-foreground">
                  {selectedTreatment.sessionStructure === 'REPEATABLE'
                    ? 'Repeatable Treatment: choose the number of Patient Sessions.'
                    : `Sequenced Treatment: ${selectedTreatment.sessions.length} prescribed Sessions.`}
                </p>
                <ol className="list-decimal space-y-1 pl-5">
                  {selectedTreatment.sessions.map((session) => (
                    <li key={session.id}>
                      {session.procedure} · {session.durationMinutes ?? 'Duration not configured'}
                      {session.durationMinutes ? ' min' : ''}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {selectedTreatment?.sessionStructure === 'REPEATABLE' ? (
              <Field data-invalid={Boolean(form.formState.errors.totalSessions)}>
                <FieldLabel htmlFor="assign-session-count">
                  Number of Sessions{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="assign-session-count"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  aria-required
                  {...form.register('totalSessions')}
                />
                {form.formState.errors.totalSessions ? (
                  <FieldError>{form.formState.errors.totalSessions.message}</FieldError>
                ) : null}
              </Field>
            ) : null}
            {selectedTreatment?.sessionStructure === 'SEQUENCED' ? (
              <Field data-invalid={Boolean(form.formState.errors.additionalSessions)}>
                <FieldLabel htmlFor="assign-additional-sessions">Additional Sessions</FieldLabel>
                <Input
                  id="assign-additional-sessions"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  {...form.register('additionalSessions')}
                />
                <p className="text-muted-foreground text-xs">
                  The {selectedTreatment.sessions.length} template Sessions are included. Extra
                  Sessions repeat the final template and are added with this Plan.
                </p>
                {form.formState.errors.additionalSessions ? (
                  <FieldError>{form.formState.errors.additionalSessions.message}</FieldError>
                ) : null}
              </Field>
            ) : null}
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={assign.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || !selectedTreatment}>
              {assign.isPending ? 'Assigning…' : 'Assign Treatment Plan'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
