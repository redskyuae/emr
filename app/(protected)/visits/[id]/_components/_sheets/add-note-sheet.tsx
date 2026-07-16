'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotebookPen } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
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
  { name: 'assessment', label: 'Assessment', placeholder: 'Clinical impression' },
  { name: 'plan', label: 'Plan', placeholder: 'Treatment and follow-up' },
] as const;

export function AddNoteSheet({
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
  const form = useForm<VisitNoteFormValues>({
    resolver: zodResolver(visitNoteFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 100 });
  const noteTypes = noteTypesQuery.data?.data ?? [];
  const createNote = useCreateClinicalNote();

  useEffect(() => {
    if (open) {
      form.reset(EMPTY);
    }
  }, [open, form]);

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await createNote.mutateAsync({
        patientId,
        body: {
          noteTypeId: Number(values.noteTypeId),
          visitId,
          subjective: values.subjective || undefined,
          objective: values.objective || undefined,
          assessment: values.assessment || undefined,
          plan: values.plan || undefined,
        },
      });
      toast.success('Clinical note added as a draft.');
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
          <SheetTitle className="text-xl">Add clinical note</SheetTitle>
          <SheetDescription>
            Authored against this Visit and saved as a draft. Sign it from the Patient Chart.
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
                        {noteTypes.map((noteType) => (
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

              {SOAP_SECTIONS.map((section) => (
                <Field
                  key={section.name}
                  data-invalid={Boolean(form.formState.errors[section.name])}
                >
                  <FieldLabel htmlFor={`note-${section.name}`}>{section.label}</FieldLabel>
                  <Textarea
                    id={`note-${section.name}`}
                    rows={3}
                    placeholder={section.placeholder}
                    {...form.register(section.name)}
                  />
                  {form.formState.errors[section.name] ? (
                    <FieldError>{form.formState.errors[section.name]?.message}</FieldError>
                  ) : null}
                </Field>
              ))}
            </FieldGroup>
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
            <Button type="submit" disabled={createNote.isPending}>
              <NotebookPen className="size-4" />
              {createNote.isPending ? 'Saving…' : 'Add note'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
