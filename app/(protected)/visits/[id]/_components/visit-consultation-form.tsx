'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Check, CheckCircle2, Save } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrors } from '@/app/queries/api-error';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { useSignClinicalNote } from '@/app/queries/patients/chart/useSignClinicalNote';
import { useUpdateClinicalNote } from '@/app/queries/patients/chart/useUpdateClinicalNote';
import { isAyurvedaBrand } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

import { consultationSections, filledFieldCount } from '../_utils/consultation-sections';
import {
  consultationToSoap,
  doctorConsultationFormSchema,
  EMPTY_CONSULTATION,
  type DoctorConsultationFormValues,
} from '../_utils/doctor-consultation-note';
import { SignConsultationDialog } from './_modals/sign-consultation-dialog';

type NarrativeName = Exclude<
  keyof DoctorConsultationFormValues,
  'modernDiagnosis' | 'noteTypeId' | 'prakriti' | 'vikriti'
>;

const PRAKRITI_SUGGESTIONS = [
  'Vata',
  'Pitta',
  'Kapha',
  'Vata-Pitta',
  'Pitta-Kapha',
  'Vata-Kapha',
  'Tridosha',
];

function FormSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="shadow-fluent-2 scroll-mt-4 gap-4 lg:scroll-mt-52">
      <CardHeader>
        <CardTitle className="text-base">
          {number}. {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function VisitConsultationForm({
  visit,
  noteTypes,
  defaultNoteTypeId,
  noteId,
  initialValues,
  onDirtyChange,
}: {
  visit: Visit;
  noteTypes: { id: number; name: string }[];
  defaultNoteTypeId: number | null;
  noteId: number | null;
  initialValues: DoctorConsultationFormValues | null;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const showAyurveda = isAyurvedaBrand(useBrandLogoVariant());
  const form = useForm<DoctorConsultationFormValues>({
    resolver: zodResolver(doctorConsultationFormSchema),
    mode: 'onTouched',
    defaultValues: initialValues ?? {
      ...EMPTY_CONSULTATION,
      noteTypeId: defaultNoteTypeId ? String(defaultNoteTypeId) : '',
      chiefComplaint: visit.chiefComplaint ?? '',
    },
  });
  const { errors, isDirty } = form.formState;
  const values = useWatch({ control: form.control });
  const selectedDiagnosis = values.modernDiagnosis;
  const [savedNoteId, setSavedNoteId] = useState(noteId);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [debouncedDiagnosisSearch] = useDebouncedValue(diagnosisSearch, { wait: 300 });
  const createNote = useCreateClinicalNote();
  const updateNote = useUpdateClinicalNote();
  const signNote = useSignClinicalNote();
  const diagnosisCodes = useDiagnosisCodesQuery({
    query: debouncedDiagnosisSearch || undefined,
    limit: 50,
  });
  const saving = createNote.isPending || updateNote.isPending || signNote.isPending;
  const patientId = visit.patient.id;

  const dirtyRef = useRef(onDirtyChange);
  useEffect(() => {
    dirtyRef.current = onDirtyChange;
  }, [onDirtyChange]);

  useEffect(() => {
    dirtyRef.current(isDirty);
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  useEffect(() => () => dirtyRef.current(false), []);

  async function persist(values: DoctorConsultationFormValues) {
    const body = {
      noteTypeId: Number(values.noteTypeId),
      visitId: visit.id,
      ...consultationToSoap(values),
    };

    if (savedNoteId) {
      await updateNote.mutateAsync({ patientId, noteId: savedNoteId, body });
      return savedNoteId;
    }

    const created = await createNote.mutateAsync({ patientId, body });
    setSavedNoteId(created.data.id);
    return created.data.id;
  }

  const saveDraft = form.handleSubmit(async (values) => {
    try {
      await persist(values);
      form.reset(values);
      setSavedAt(new Date());
      toast.success('Consultation draft saved.');
    } catch (error) {
      form.setError('root', { message: getApiErrors(error).join(' ') });
    }
  });

  const saveAndSign = form.handleSubmit(async (values) => {
    setSignOpen(false);
    try {
      const id = await persist(values);
      form.reset(values);
      await signNote.mutateAsync({ patientId, noteId: id });
      toast.success('Consultation signed.');
    } catch (error) {
      form.setError('root', { message: getApiErrors(error).join(' ') });
    }
  });

  function narrative(name: NarrativeName, label: string, placeholder: string, wide = false) {
    const required = name === 'chiefComplaint';

    return (
      <Field data-invalid={Boolean(errors[name])} className={wide ? 'md:col-span-2' : undefined}>
        <FieldLabel htmlFor={`consult-${name}`}>
          {label}
          {required ? (
            <span aria-hidden="true" className="text-destructive">
              {' '}
              *
            </span>
          ) : null}
        </FieldLabel>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <RichTextEditor
              id={`consult-${name}`}
              aria-label={label}
              placeholder={placeholder}
              required={required}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors[name])}
            />
          )}
        />
        {errors[name] ? <FieldError>{errors[name]?.message}</FieldError> : null}
      </Field>
    );
  }

  const diagnosisOptions = (diagnosisCodes.data?.data ?? []).map(
    (item) => `${item.code} — ${item.title}`
  );
  const sections = consultationSections(showAyurveda);
  const sectionNumber = (id: string) => sections.findIndex((section) => section.id === id) + 1;
  const options =
    selectedDiagnosis && !diagnosisOptions.includes(selectedDiagnosis)
      ? [selectedDiagnosis, ...diagnosisOptions]
      : diagnosisOptions;

  return (
    <form
      className="space-y-4"
      aria-label="Doctor consultation"
      onSubmit={(event) => {
        event.preventDefault();
        void saveDraft();
      }}
    >
      {errors.root ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save consultation</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <nav
        aria-label="Consultation sections"
        className="acrylic shadow-fluent-2 z-[5] flex gap-1 overflow-x-auto rounded-lg border p-1 lg:sticky lg:top-38"
      >
        {sections.map((section, index) => {
          const filled = filledFieldCount(section, values);

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm outline-none focus-visible:ring-3"
            >
              <span className="font-medium">
                {index + 1}. {section.title}
              </span>
              <span className="text-muted-foreground flex items-center gap-0.5 text-xs tabular-nums">
                {filled > 0 ? <Check className="size-3" aria-hidden="true" /> : null}
                {filled}/{section.fields.length}
              </span>
            </a>
          );
        })}
      </nav>

      <FormSection
        id="consult-presenting"
        number={sectionNumber('consult-presenting')}
        title="Presenting complaint"
        description="Why the Patient is here and how the condition has developed."
      >
        <Field data-invalid={Boolean(errors.noteTypeId)}>
          <FieldLabel htmlFor="consult-note-type">
            Clinical Note Type
            <span aria-hidden="true" className="text-destructive">
              {' '}
              *
            </span>
          </FieldLabel>
          <NativeSelect
            id="consult-note-type"
            className="w-full"
            aria-required
            aria-invalid={Boolean(errors.noteTypeId)}
            {...form.register('noteTypeId')}
          >
            <NativeSelectOption value="">Select a note type</NativeSelectOption>
            {noteTypes.map((type) => (
              <NativeSelectOption key={type.id} value={String(type.id)}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.noteTypeId ? <FieldError>{errors.noteTypeId.message}</FieldError> : null}
        </Field>
        {narrative('chiefComplaint', 'Chief complaint', 'Main reason for this Visit', true)}
        {narrative('hpi', 'Present condition / HPI', 'Onset, duration, severity, triggers', true)}
      </FormSection>

      <FormSection
        id="consult-history"
        number={sectionNumber('consult-history')}
        title="History"
        description="Leave blank anything that is not relevant."
      >
        {narrative('medicalHistory', 'Past medical history', 'Known conditions')}
        {narrative('surgicalHistory', 'Past surgical history', 'Operations and procedures')}
        {narrative('familySocialHistory', 'Family / social history', 'Family, work, habits', true)}
      </FormSection>

      <FormSection
        id="consult-examination"
        number={sectionNumber('consult-examination')}
        title="Examination and diagnosis"
        description="Findings today and the working diagnosis."
      >
        {narrative('examination', 'Examination / red flags', 'Findings and any red flags', true)}
        <Controller
          control={form.control}
          name="modernDiagnosis"
          render={({ field }) => (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="consult-diagnosis-code">Modern diagnosis code</FieldLabel>
              <Combobox<string>
                items={options}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
                onInputValueChange={setDiagnosisSearch}
              >
                <ComboboxInput
                  id="consult-diagnosis-code"
                  className="w-full"
                  placeholder="Search Diagnosis Codes by code or title"
                  onBlur={field.onBlur}
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {diagnosisCodes.isFetching
                      ? 'Searching Diagnosis Codes…'
                      : 'No Diagnosis Codes found.'}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {options.map((option) => (
                      <ComboboxItem key={option} value={option}>
                        {option}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {diagnosisCodes.isError ? (
                <p className="text-destructive text-sm">Diagnosis Codes could not be loaded.</p>
              ) : null}
            </Field>
          )}
        />
      </FormSection>

      {showAyurveda ? (
        <FormSection
          id="consult-ayurveda"
          number={sectionNumber('consult-ayurveda')}
          title="Ayurvedic assessment"
          description="Clinician-entered narrative until a validated terminology catalogue is configured."
        >
          <Field data-invalid={Boolean(errors.prakriti)}>
            <FieldLabel htmlFor="consult-prakriti">Prakriti</FieldLabel>
            <Input
              id="consult-prakriti"
              placeholder="Constitution"
              aria-invalid={Boolean(errors.prakriti)}
              {...form.register('prakriti')}
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Prakriti suggestions">
              {PRAKRITI_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    form.setValue('prakriti', suggestion, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            {errors.prakriti ? <FieldError>{errors.prakriti.message}</FieldError> : null}
          </Field>
          <Field data-invalid={Boolean(errors.vikriti)}>
            <FieldLabel htmlFor="consult-vikriti">Vikriti / body condition</FieldLabel>
            <Input
              id="consult-vikriti"
              placeholder="Current imbalance"
              aria-invalid={Boolean(errors.vikriti)}
              {...form.register('vikriti')}
            />
            {errors.vikriti ? <FieldError>{errors.vikriti.message}</FieldError> : null}
          </Field>
          {narrative('ayurvedicDiagnosis', 'Ayurvedic diagnosis', 'Roga and dosha involved', true)}
        </FormSection>
      ) : null}

      <FormSection
        id="consult-plan"
        number={sectionNumber('consult-plan')}
        title="Plan"
        description="What the care team must watch for during treatment."
      >
        {narrative('precautions', 'Treatment precautions', 'Precautions and advice', true)}
      </FormSection>

      <div className="acrylic shadow-fluent-8 sticky bottom-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
        <p className="text-muted-foreground text-sm" role="status">
          {isDirty
            ? 'Unsaved changes'
            : savedAt
              ? `Draft saved at ${savedAt.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : savedNoteId
                ? 'Draft saved'
                : 'Not saved yet'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={saving}>
            <Save className="size-4" />
            {createNote.isPending || updateNote.isPending ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="button" disabled={saving} onClick={() => setSignOpen(true)}>
            <CheckCircle2 className="size-4" />
            {signNote.isPending ? 'Signing…' : 'Save and sign'}
          </Button>
        </div>
      </div>

      <SignConsultationDialog
        open={signOpen}
        onClose={() => setSignOpen(false)}
        onConfirm={() => void saveAndSign()}
      />
    </form>
  );
}
