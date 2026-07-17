'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, type Path, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateDoctor } from '@/app/queries/doctors/useCreateDoctor';
import { useUpdateDoctor } from '@/app/queries/doctors/useUpdateDoctor';
import { useSpecialtiesQuery } from '@/app/queries/specialties/useSpecialties';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
  doctorFormSchema,
  DOCTOR_GENDER_OPTIONS,
  type DoctorFormValues,
} from '../../_utils/doctor-form-schema';
import {
  buildCreateDoctorRequest,
  buildUpdateDoctorRequest,
  doctorToFormValues,
  EMPTY_DOCTOR_FORM_VALUES,
} from '../../_utils/doctor-form-values';

type DoctorFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  doctorId: number | null;
  doctor: Doctor | null;
  isResolving: boolean;
  onClose: () => void;
};

const FIELD_ERROR_MATCHERS: Array<{ field: Path<DoctorFormValues>; patterns: string[] }> = [
  { field: 'name', patterns: ['Name '] },
  { field: 'email', patterns: ['Email ', 'email', 'Staff member with this email'] },
  { field: 'password', patterns: ['Password '] },
  { field: 'specialtyId', patterns: ['Specialty '] },
  { field: 'gender', patterns: ['Gender '] },
  { field: 'dateOfBirth', patterns: ['Date of birth '] },
  { field: 'staffCode', patterns: ['Staff code'] },
  { field: 'designation', patterns: ['Designation '] },
  { field: 'registrationNumber', patterns: ['Doctor registration number'] },
];

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  );
}

function mapServerErrors(form: ReturnType<typeof useForm<DoctorFormValues>>, errors: string[]) {
  const unmapped: string[] = [];

  for (const error of errors) {
    const match = FIELD_ERROR_MATCHERS.find(({ patterns }) =>
      patterns.some((pattern) => error.includes(pattern))
    );

    if (match) {
      form.setError(match.field, { type: 'server', message: error });
    } else {
      unmapped.push(error);
    }
  }

  return unmapped;
}

export function DoctorFormSheet({
  open,
  mode,
  doctorId,
  doctor,
  onClose,
  isResolving,
}: DoctorFormSheetProps) {
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();
  const specialtiesQuery = useSpecialtiesQuery({ limit: 999 });
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<DoctorFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DOCTOR_FORM_VALUES,
    resolver: zodResolver(doctorFormSchema),
  });

  const specialties = specialtiesQuery.data?.data ?? [];
  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : doctorId === null ? null : String(doctorId);
  const hasNoSpecialties =
    !specialtiesQuery.isLoading && !specialtiesQuery.isError && specialties.length === 0;

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (sessionKey === null || isResolving) {
      return;
    }

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    setPasswordVisible(false);
    form.reset(isCreating ? EMPTY_DOCTOR_FORM_VALUES : doctorToFormValues(doctor));
  }, [doctor, form, isCreating, isResolving, open, sessionKey]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);
    form.clearErrors();

    if (isCreating) {
      let hasCreateError = false;

      if (!values.email.trim()) {
        form.setError('email', { type: 'manual', message: 'Email is required' });
        hasCreateError = true;
      }

      if (values.password.length < 8) {
        form.setError('password', {
          type: 'manual',
          message: 'Password must be at least 8 characters',
        });
        hasCreateError = true;
      }

      if (hasCreateError) {
        return;
      }
    }

    try {
      if (isCreating) {
        await createMutation.mutateAsync(buildCreateDoctorRequest(values));
        toast.success('Doctor created.');
        onClose();
        return;
      }

      if (doctorId === null) {
        return;
      }

      await updateMutation.mutateAsync({ id: doctorId, request: buildUpdateDoctorRequest(values) });
      toast.success('Doctor updated.');
      onClose();
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(mapServerErrors(form, errors));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add Doctor' : `Edit ${doctor?.name ?? 'Doctor'}`;
  const sheetDescription = isCreating
    ? 'Create the Doctor Staff identity and assign a Specialty.'
    : 'Update Doctor profile details and Specialty.';

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-xl"
        style={{ width: 'min(576px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {isResolving ? (
          <div className="flex-1 space-y-4 p-4">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <form
            id="doctor-form"
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-4">
              {serverErrors.length > 0 ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4">
                      {serverErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {specialtiesQuery.isError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Could not load Specialties</AlertTitle>
                  <AlertDescription>{getApiErrorMessage(specialtiesQuery.error)}</AlertDescription>
                </Alert>
              ) : hasNoSpecialties ? (
                <Alert className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>No Specialties configured</AlertTitle>
                  <AlertDescription>
                    Add a Specialty before creating or updating Doctors.
                  </AlertDescription>
                </Alert>
              ) : null}

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="doctor-name">
                        Name <RequiredMark />
                      </FieldLabel>
                      <Input
                        id="doctor-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Dr Anita Mehta"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="doctor-email">
                          Email {isCreating ? <RequiredMark /> : null}
                        </FieldLabel>
                        <Input
                          id="doctor-email"
                          {...field}
                          type="email"
                          disabled={isSaving || !isCreating}
                          placeholder="doctor@example.com"
                          aria-required={isCreating}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  {isCreating ? (
                    <Controller
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="doctor-password">
                            Password <RequiredMark />
                          </FieldLabel>
                          <div className="relative">
                            <Input
                              id="doctor-password"
                              {...field}
                              type={passwordVisible ? 'text' : 'password'}
                              disabled={isSaving}
                              minLength={8}
                              className="pr-10"
                              aria-required="true"
                              aria-invalid={fieldState.invalid}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="absolute top-1/2 right-1 -translate-y-1/2"
                              disabled={isSaving}
                              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                              onClick={() => setPasswordVisible((visible) => !visible)}
                            >
                              {passwordVisible ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </Button>
                          </div>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="specialtyId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="doctor-specialty">
                          Specialty <RequiredMark />
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSaving || hasNoSpecialties}
                        >
                          <SelectTrigger
                            id="doctor-specialty"
                            className="w-full"
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Select Specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem key={specialty.id} value={String(specialty.id)}>
                                {specialty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="gender"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="doctor-gender">Gender</FieldLabel>
                        <Select
                          value={field.value || 'none'}
                          onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger
                            id="doctor-gender"
                            className="w-full"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            {DOCTOR_GENDER_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="doctor-dob">Date of birth</FieldLabel>
                        <Input
                          id="doctor-dob"
                          {...field}
                          type="date"
                          disabled={isSaving}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="staffCode"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="doctor-staff-code">Staff code</FieldLabel>
                        <Input
                          id="doctor-staff-code"
                          {...field}
                          disabled={isSaving}
                          maxLength={20}
                          placeholder="e.g. DOC-101"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  control={form.control}
                  name="designation"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="doctor-designation">Designation</FieldLabel>
                      <Input
                        id="doctor-designation"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Senior Consultant"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="registrationNumber"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="doctor-registration">Registration number</FieldLabel>
                      <Input
                        id="doctor-registration"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. TNMC-12345"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="qualifications"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="doctor-qualifications">Qualifications</FieldLabel>
                      <Textarea
                        id="doctor-qualifications"
                        {...field}
                        disabled={isSaving}
                        rows={3}
                        placeholder="e.g. MBBS, MD"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            <SheetFooter className="border-t p-4">
              <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="doctor-form"
                disabled={isSaving || specialtiesQuery.isLoading || hasNoSpecialties}
              >
                <Save className="size-4" />
                {isSaving ? 'Saving...' : 'Save Doctor'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
