'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PencilLine } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { useAdmitSourcesQuery } from '@/app/queries/visit-masters/admit-sources/useAdmitSources';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { useAmendVisit } from '@/app/queries/visits/useAmendVisit';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { CHIEF_COMPLAINT_MAX } from '../../../new/_utils/create-visit-form-schema';
import {
  amendVisitFormDefaults,
  amendVisitFormSchema,
  toAmendVisitRequest,
  type AmendVisitFormValues,
} from '../../_utils/amend-visit-form-schema';

type Option = { id: number; label: string };

/** Keeps the recorded value selectable even when it is now inactive or off the first page. */
function withCurrent(options: Option[], current: Option | null) {
  if (!current || options.some((option) => option.id === current.id)) return options;
  return [current, ...options];
}

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  );
}

function SelectSkeleton({ label }: { label: string }) {
  return <Skeleton className="h-9 w-full" aria-label={`Loading ${label}`} />;
}

/**
 * Corrects a Completed Visit's own record: who saw the Patient, how the Visit is
 * classified, the Treatment it delivered and what was written at check-in.
 */
export function AmendVisitSheet({
  open,
  visit,
  onClose,
}: {
  open: boolean;
  visit: Visit;
  onClose: () => void;
}) {
  const form = useForm<AmendVisitFormValues>({
    resolver: zodResolver(amendVisitFormSchema),
    mode: 'onTouched',
    defaultValues: amendVisitFormDefaults(visit),
  });
  const amendMutation = useAmendVisit();
  const doctorsQuery = useDoctorsQuery(
    { page: 1, limit: 100, status: 'active' },
    { enabled: open }
  );
  const visitTypesQuery = useVisitTypesQuery({ limit: 100 });
  const admitSourcesQuery = useAdmitSourcesQuery({ limit: 100 });
  const treatmentsQuery = useTreatmentsQuery({ page: 1, limit: 999 }, { enabled: open });
  const [treatmentId, chiefComplaint] = useWatch({
    control: form.control,
    name: ['treatmentId', 'chiefComplaint'],
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) {
      form.reset(amendVisitFormDefaults(visit));
    }
  }, [open, visit, form]);

  const doctors = withCurrent(
    (doctorsQuery.data?.data ?? []).map((doctor) => ({ id: doctor.id, label: doctor.name })),
    { id: visit.doctor.id, label: visit.doctor.name }
  );
  const visitTypes = withCurrent(
    (visitTypesQuery.data?.data ?? []).map((type) => ({ id: type.id, label: type.name })),
    { id: visit.visitType.id, label: visit.visitType.name }
  );
  const admitSources = withCurrent(
    (admitSourcesQuery.data?.data ?? []).map((source) => ({ id: source.id, label: source.name })),
    visit.admitSource ? { id: visit.admitSource.id, label: visit.admitSource.name } : null
  );
  const treatments = treatmentsQuery.data?.data ?? [];
  const selectedTreatment = treatments.find((item) => String(item.id) === treatmentId);
  const loadFailed =
    doctorsQuery.isError ||
    visitTypesQuery.isError ||
    admitSourcesQuery.isError ||
    treatmentsQuery.isError;
  const loading =
    doctorsQuery.isLoading ||
    visitTypesQuery.isLoading ||
    admitSourcesQuery.isLoading ||
    treatmentsQuery.isLoading;

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await amendMutation.mutateAsync({ id: visit.id, request: toAmendVisitRequest(values) });
      toast.success(`${visit.visitNumber} amended.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  function retryAll() {
    if (doctorsQuery.isError) void doctorsQuery.refetch();
    if (visitTypesQuery.isError) void visitTypesQuery.refetch();
    if (admitSourcesQuery.isError) void admitSourcesQuery.refetch();
    if (treatmentsQuery.isError) void treatmentsQuery.refetch();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(620px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">Amend Visit</SheetTitle>
          <SheetDescription>
            Correct <span className="font-mono">{visit.visitNumber}</span> after completion. The
            Visit date, number and Queue Token stay as recorded.
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
              {loadFailed ? (
                <Alert variant="destructive">
                  <AlertTitle>Some choices could not be loaded</AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    Retry before amending so no field is cleared by mistake.
                    <Button type="button" size="sm" variant="outline" onClick={retryAll}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(errors.doctorId)}>
                  <FieldLabel htmlFor="amend-doctor">
                    Doctor <RequiredMark />
                  </FieldLabel>
                  {doctorsQuery.isLoading ? (
                    <SelectSkeleton label="Doctors" />
                  ) : (
                    <NativeSelect
                      id="amend-doctor"
                      className="w-full"
                      aria-required
                      aria-invalid={Boolean(errors.doctorId)}
                      {...form.register('doctorId')}
                    >
                      <NativeSelectOption value="">Select a Doctor</NativeSelectOption>
                      {doctors.map((doctor) => (
                        <NativeSelectOption key={doctor.id} value={String(doctor.id)}>
                          {doctor.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                  <FieldError>{errors.doctorId?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.visitTypeId)}>
                  <FieldLabel htmlFor="amend-visit-type">
                    Visit Type <RequiredMark />
                  </FieldLabel>
                  {visitTypesQuery.isLoading ? (
                    <SelectSkeleton label="Visit Types" />
                  ) : (
                    <NativeSelect
                      id="amend-visit-type"
                      className="w-full"
                      aria-required
                      aria-invalid={Boolean(errors.visitTypeId)}
                      {...form.register('visitTypeId')}
                    >
                      <NativeSelectOption value="">Select a Visit Type</NativeSelectOption>
                      {visitTypes.map((type) => (
                        <NativeSelectOption key={type.id} value={String(type.id)}>
                          {type.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                  <FieldError>{errors.visitTypeId?.message}</FieldError>
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="amend-admit-source">Admit Source</FieldLabel>
                  {admitSourcesQuery.isLoading ? (
                    <SelectSkeleton label="Admit Sources" />
                  ) : (
                    <NativeSelect
                      id="amend-admit-source"
                      className="w-full"
                      {...form.register('admitSourceId')}
                    >
                      <NativeSelectOption value="">No Admit Source</NativeSelectOption>
                      {admitSources.map((source) => (
                        <NativeSelectOption key={source.id} value={String(source.id)}>
                          {source.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="amend-treatment">Treatment</FieldLabel>
                  {treatmentsQuery.isLoading ? (
                    <SelectSkeleton label="Treatments" />
                  ) : (
                    <NativeSelect
                      id="amend-treatment"
                      className="w-full"
                      {...form.register('treatmentId', {
                        onChange: () => form.setValue('treatmentSessionId', ''),
                      })}
                    >
                      <NativeSelectOption value="">No Treatment</NativeSelectOption>
                      {withCurrent(
                        treatments.map((item) => ({
                          id: item.id,
                          label: `${item.name} · ${item.code}`,
                        })),
                        visit.treatment
                          ? { id: visit.treatment.id, label: visit.treatment.name }
                          : null
                      ).map((item) => (
                        <NativeSelectOption key={item.id} value={String(item.id)}>
                          {item.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>

                <Field data-invalid={Boolean(errors.treatmentSessionId)}>
                  <FieldLabel htmlFor="amend-session">Session</FieldLabel>
                  {treatmentsQuery.isLoading ? (
                    <SelectSkeleton label="Sessions" />
                  ) : (
                    <NativeSelect
                      id="amend-session"
                      className="w-full"
                      disabled={!treatmentId}
                      aria-invalid={Boolean(errors.treatmentSessionId)}
                      {...form.register('treatmentSessionId')}
                    >
                      <NativeSelectOption value="">No Session</NativeSelectOption>
                      {withCurrent(
                        (selectedTreatment?.sessions ?? []).map((session) => ({
                          id: session.id,
                          label: session.label,
                        })),
                        visit.treatmentSession && String(visit.treatment?.id) === treatmentId
                          ? { id: visit.treatmentSession.id, label: visit.treatmentSession.label }
                          : null
                      ).map((session) => (
                        <NativeSelectOption key={session.id} value={String(session.id)}>
                          {session.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                  <FieldError>{errors.treatmentSessionId?.message}</FieldError>
                </Field>
              </div>

              <Controller
                control={form.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <Field data-invalid={Boolean(errors.chiefComplaint)}>
                    <FieldLabel htmlFor="amend-complaint">Purpose of Visit</FieldLabel>
                    <RichTextEditor
                      id="amend-complaint"
                      aria-label="Purpose of Visit"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={Boolean(errors.chiefComplaint)}
                      placeholder="Patient's presenting concern"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <FieldError>{errors.chiefComplaint?.message}</FieldError>
                      <p
                        className={
                          chiefComplaint.trim().length > CHIEF_COMPLAINT_MAX
                            ? 'text-destructive ml-auto font-mono text-xs'
                            : 'text-muted-foreground ml-auto font-mono text-xs'
                        }
                      >
                        {chiefComplaint.trim().length} / {CHIEF_COMPLAINT_MAX}
                      </p>
                    </div>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="amend-remarks">Remarks</FieldLabel>
                    <RichTextEditor
                      id="amend-remarks"
                      aria-label="Remarks"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Anything the next person should know"
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={amendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={amendMutation.isPending || loading || loadFailed}
              aria-busy={amendMutation.isPending}
            >
              <PencilLine className="size-4" />
              {amendMutation.isPending ? 'Saving…' : 'Save amendment'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
