'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { TreatmentSessionSummary } from '@/app/api/lib/modules/treatment/schemas/treatment-schema';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { getApiErrors } from '@/app/queries/api-error';
import { useAppointmentQuery } from '@/app/queries/appointments/useAppointment';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { useRoomQuery } from '@/app/queries/rooms/useRoom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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

import {
  dailyTreatmentFormSchema,
  dailyTreatmentToSoap,
  type DailyTreatmentFormValues,
} from '../../_utils/daily-treatment-note';

export function DailyTreatmentSheet({
  open,
  patientId,
  visitId,
  appointmentId,
  session,
  onClose,
}: {
  open: boolean;
  patientId: number;
  visitId: number;
  appointmentId: number | null;
  session: TreatmentSessionSummary;
  onClose: () => void;
}) {
  const appointment = useAppointmentQuery(appointmentId);
  const room = useRoomQuery(appointment.data?.roomId ?? null);
  const noteTypes = useClinicalNoteTypesQuery({ limit: 100 });
  const [selectedNoteTypeId, setSelectedNoteTypeId] = useState<number | null>(null);
  const progressType = noteTypes.data?.data.find((type) => type.code === 'PROG');
  const availableNoteTypes = noteTypes.data?.data ?? [];
  const noteTypeId = selectedNoteTypeId ?? progressType?.id ?? availableNoteTypes[0]?.id;
  const createNote = useCreateClinicalNote();
  const form = useForm<DailyTreatmentFormValues>({
    resolver: zodResolver(dailyTreatmentFormSchema),
    mode: 'onTouched',
    defaultValues: {
      actualMinutes: '',
      response: '',
      painScore: '',
      variations: '',
      adverseEvents: '',
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        actualMinutes: session.durationMinutes ? String(session.durationMinutes) : '',
        response: '',
        painScore: '',
        variations: '',
        adverseEvents: '',
      });
  }, [open, session.durationMinutes, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!noteTypeId) return;
    try {
      await createNote.mutateAsync({
        patientId,
        body: {
          noteTypeId,
          visitId,
          ...dailyTreatmentToSoap(values, session),
        },
      });
      toast.success('Treatment response saved as a draft Clinical Note.');
      onClose();
    } catch (error) {
      form.setError('root', { message: getApiErrors(error).join(' ') });
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(620px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle>Daily Treatment Session</SheetTitle>
          <SheetDescription>
            Record the response and any variation against this Visit. Completing the Visit completes
            its reserved Patient Treatment Plan Session.
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
            <div className="space-y-1 rounded-md border p-3 text-sm">
              <p className="font-medium">
                Session {session.sessionNumber} · {session.procedure}
              </p>
              <p className="text-muted-foreground">
                Planned duration:{' '}
                {session.durationMinutes ? `${session.durationMinutes} minutes` : 'Not configured'}
              </p>
              {appointment.isLoading || room.isLoading ? (
                <Skeleton className="h-4 w-48" aria-label="Loading Appointment and Room" />
              ) : appointment.isError || room.isError ? (
                <p className="text-destructive">Appointment or Room details could not be loaded.</p>
              ) : (
                <p className="text-muted-foreground">
                  Therapist: {appointment.data?.therapist?.name ?? 'Not assigned'} · Room:{' '}
                  {room.data?.roomNumber ?? 'Not assigned'}
                </p>
              )}
            </div>
            {noteTypes.isLoading ? (
              <div className="space-y-2" aria-label="Loading Clinical Note Types">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}
            {noteTypes.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Clinical Note Types could not be loaded</AlertTitle>
                <AlertDescription>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void noteTypes.refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {availableNoteTypes.length === 0 && !noteTypes.isLoading && !noteTypes.isError ? (
              <Alert variant="destructive">
                <AlertTitle>No Clinical Note Types configured</AlertTitle>
                <AlertDescription>
                  <Link href="/clinical-masters/note-types" className="underline">
                    Configure a Clinical Note Type
                  </Link>{' '}
                  before saving.
                </AlertDescription>
              </Alert>
            ) : null}
            {availableNoteTypes.length > 0 ? (
              <Field>
                <FieldLabel htmlFor="treatment-note-type">Clinical Note Type</FieldLabel>
                <NativeSelect
                  id="treatment-note-type"
                  value={String(noteTypeId)}
                  onChange={(event) => setSelectedNoteTypeId(Number(event.target.value))}
                >
                  {availableNoteTypes.map((type) => (
                    <NativeSelectOption key={type.id} value={String(type.id)}>
                      {type.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            {form.formState.errors.root ? (
              <Alert variant="destructive">
                <AlertTitle>Could not save treatment response</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(form.formState.errors.actualMinutes)}>
                <FieldLabel htmlFor="session-minutes">Actual duration (minutes)</FieldLabel>
                <Input
                  id="session-minutes"
                  inputMode="numeric"
                  {...form.register('actualMinutes')}
                />
                {form.formState.errors.actualMinutes ? (
                  <FieldError>{form.formState.errors.actualMinutes.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.painScore)}>
                <FieldLabel htmlFor="session-pain">Pain score (0–10)</FieldLabel>
                <Input id="session-pain" inputMode="numeric" {...form.register('painScore')} />
                {form.formState.errors.painScore ? (
                  <FieldError>{form.formState.errors.painScore.message}</FieldError>
                ) : null}
              </Field>
            </div>
            <Field data-invalid={Boolean(form.formState.errors.response)}>
              <FieldLabel htmlFor="session-response">
                Treatment response{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FieldLabel>
              <Controller
                control={form.control}
                name="response"
                render={({ field }) => (
                  <RichTextEditor
                    id="session-response"
                    aria-label="Treatment response"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={Boolean(form.formState.errors.response)}
                  />
                )}
              />
              {form.formState.errors.response ? (
                <FieldError>{form.formState.errors.response.message}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="session-variations">Variations / therapist notes</FieldLabel>
              <Controller
                control={form.control}
                name="variations"
                render={({ field }) => (
                  <RichTextEditor
                    id="session-variations"
                    aria-label="Variations / therapist notes"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="session-adverse">Adverse events</FieldLabel>
              <Controller
                control={form.control}
                name="adverseEvents"
                render={({ field }) => (
                  <RichTextEditor
                    id="session-adverse"
                    aria-label="Adverse events"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Field>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createNote.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createNote.isPending || noteTypes.isLoading || noteTypes.isError || !noteTypeId
              }
            >
              {createNote.isPending ? 'Saving…' : 'Record Session'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
