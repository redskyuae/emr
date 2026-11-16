'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotebookPen } from 'lucide-react';
import { toast } from 'sonner';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { useAmendVisitClinicalNote } from '@/app/queries/visits/useAmendVisitClinicalNote';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  visitNoteFormSchema,
  type VisitNoteFormValues,
} from '../../_utils/visit-capture-form-schema';

const EMPTY: VisitNoteFormValues = {
  noteTypeId: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

const SOAP_SECTIONS = [
  { name: 'subjective', label: 'Subjective', placeholder: 'What the Patient reports' },
  { name: 'objective', label: 'Objective', placeholder: 'Examination findings' },
  { name: 'assessment', label: 'Diagnosis', placeholder: 'Clinical impression and diagnosis' },
  { name: 'plan', label: 'Plan', placeholder: 'Treatment and follow-up' },
] as const;

function fromNote(note: ClinicalNote): VisitNoteFormValues {
  return {
    noteTypeId: String(note.noteTypeId),
    subjective: note.subjective ?? '',
    objective: note.objective ?? '',
    assessment: note.assessment ?? '',
    plan: note.plan ?? '',
  };
}

/**
 * Adds a draft Clinical Note to an active Visit, or — given `note` — amends a note
 * already on a Completed Visit. An amended note keeps its status and signature.
 */
export function AddNoteSheet({
  open,
  patientId,
  visitId,
  preferredNoteTypeCode,
  note = null,
  onClose,
}: {
  open: boolean;
  patientId: number;
  visitId: number;
  preferredNoteTypeCode?: string;
  note?: ClinicalNote | null;
  onClose: () => void;
}) {
  const form = useForm<VisitNoteFormValues>({
    resolver: zodResolver(visitNoteFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const noteTypes = noteTypesQuery.data?.data;
  const createNote = useCreateClinicalNote();
  const amendNote = useAmendVisitClinicalNote();
  const amending = note !== null;
  const pending = createNote.isPending || amendNote.isPending;

  useEffect(() => {
    if (open) {
      form.reset(note ? fromNote(note) : EMPTY);
    }
  }, [open, note, form]);

  useEffect(() => {
    if (!open || !preferredNoteTypeCode || form.getValues('noteTypeId')) return;
    const preferred = noteTypes?.find((type) => type.code === preferredNoteTypeCode);
    if (preferred) form.setValue('noteTypeId', String(preferred.id));
  }, [open, preferredNoteTypeCode, noteTypes, form]);

  const handleSave = form.handleSubmit(async (values) => {
    const content = {
      noteTypeId: Number(values.noteTypeId),
      subjective: values.subjective || undefined,
      objective: values.objective || undefined,
      assessment: values.assessment || undefined,
      plan: values.plan || undefined,
    };

    try {
      if (note) {
        await amendNote.mutateAsync({ visitId, patientId, noteId: note.id, body: content });
        toast.success('Clinical note amended.');
      } else {
        await createNote.mutateAsync({ patientId, body: { visitId, ...content } });
        toast.success('Clinical note added as a draft.');
      }
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
        style={{ width: 'min(620px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {amending ? 'Amend clinical note' : 'Add clinical note'}
          </SheetTitle>
          <SheetDescription>
            {note
              ? note.status === 'signed'
                ? 'This note is signed. Your correction replaces the recorded text and the note stays signed.'
                : 'Correct this draft note on the Completed Visit.'
              : 'Authored against this Visit and saved as a draft. Sign it under Clinical records.'}
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
              {noteTypesQuery.isLoading ? (
                <div className="space-y-2" aria-label="Loading Clinical Note Types">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : noteTypesQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Clinical Note Types could not be loaded. Retry to continue.
                  </AlertDescription>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void noteTypesQuery.refetch()}
                  >
                    Retry
                  </Button>
                </Alert>
              ) : (
                <Controller
                  control={form.control}
                  name="noteTypeId"
                  render={({ field }) => (
                    <Field data-invalid={Boolean(form.formState.errors.noteTypeId)}>
                      <FieldLabel htmlFor="note-type">
                        Note type{' '}
                        <span aria-hidden className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value === '' ? undefined : field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="note-type" aria-required className="w-full">
                          <SelectValue placeholder="Select a note type" />
                        </SelectTrigger>
                        <SelectContent>
                          {(noteTypes ?? []).map((noteType) => (
                            <SelectItem key={noteType.id} value={String(noteType.id)}>
                              {noteType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.noteTypeId ? (
                        <FieldError>{form.formState.errors.noteTypeId.message}</FieldError>
                      ) : null}
                    </Field>
                  )}
                />
              )}

              {SOAP_SECTIONS.map((section) => (
                <Field
                  key={section.name}
                  data-invalid={Boolean(form.formState.errors[section.name])}
                >
                  <FieldLabel htmlFor={`note-${section.name}`}>{section.label}</FieldLabel>
                  <Controller
                    control={form.control}
                    name={section.name}
                    render={({ field }) => (
                      <RichTextEditor
                        id={`note-${section.name}`}
                        aria-label={section.label}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder={section.placeholder}
                        invalid={Boolean(form.formState.errors[section.name])}
                      />
                    )}
                  />
                  {form.formState.errors[section.name] ? (
                    <FieldError>{form.formState.errors[section.name]?.message}</FieldError>
                  ) : null}
                </Field>
              ))}
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              aria-busy={pending}
              disabled={
                pending || noteTypesQuery.isLoading || noteTypesQuery.isError || !noteTypes?.length
              }
            >
              <NotebookPen className="size-4" />
              {pending ? 'Saving…' : amending ? 'Save amendment' : 'Add note'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
