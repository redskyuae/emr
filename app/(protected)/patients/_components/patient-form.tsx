'use client';

import { useState } from 'react';
import { Controller, type Control, type UseFormSetValue, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save, UserRoundPlus } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCountriesQuery } from '@/app/queries/global-references/useCountries';
import { useLanguagesQuery } from '@/app/queries/global-references/useLanguages';
import { useNationalitiesQuery } from '@/app/queries/global-references/useNationalities';
import { useReligionsQuery } from '@/app/queries/global-references/useReligions';
import { useStatesQuery } from '@/app/queries/global-references/useStates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { patientFormSchema, type PatientFormValues } from '../_utils/patient-form-schema';
import {
  PATIENT_BLOOD_GROUPS,
  PATIENT_GENDER_OPTIONS,
  PATIENT_GOVT_ID_TYPE_OPTIONS,
  PATIENT_MARITAL_STATUS_OPTIONS,
} from '../_utils/patient-value-sets';

const NONE = 'none';

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function FormErrors({ errors }: { errors: string[] }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Save failed</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

type MasterSelectProps = {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  options: { id: number; name: string }[];
  loading: boolean;
  disabled?: boolean;
  placeholder?: string;
};

function MasterSelect({
  id,
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder,
}: MasterSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value !== undefined ? String(value) : NONE}
        onValueChange={(next) => onChange(next === NONE ? undefined : Number(next))}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={loading ? 'Loading…' : (placeholder ?? 'Not specified')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Not specified</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function DemographicsSection({ control }: { control: Control<PatientFormValues> }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
        <CardDescription>The Patient&apos;s legal name and core identity details.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-first-name">
                    First name
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="patient-first-name"
                    {...field}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="middleName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-middle-name">Middle name</FieldLabel>
                  <Input id="patient-middle-name" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-last-name">
                    Last name
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="patient-last-name"
                    {...field}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Controller
              control={control}
              name="gender"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-gender">
                    Gender
                    <RequiredMark />
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="patient-gender"
                      className="w-full"
                      aria-required={true}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {PATIENT_GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-dob">
                    Date of birth
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="patient-dob"
                    type="date"
                    {...field}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="bloodGroup"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="patient-blood-group">Blood group</FieldLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
                  >
                    <SelectTrigger id="patient-blood-group" className="w-full">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not specified</SelectItem>
                      {PATIENT_BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              control={control}
              name="maritalStatus"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="patient-marital-status">Marital status</FieldLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
                  >
                    <SelectTrigger id="patient-marital-status" className="w-full">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not specified</SelectItem>
                      {PATIENT_MARITAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function ContactSection({ control }: { control: Control<PatientFormValues> }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Contact</CardTitle>
        <CardDescription>How this Patient can be reached.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-phone">
                  Phone
                  <RequiredMark />
                </FieldLabel>
                <Input
                  id="patient-phone"
                  type="tel"
                  {...field}
                  aria-required={true}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="alternatePhone"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-alternate-phone">Alternate phone</FieldLabel>
                <Input
                  id="patient-alternate-phone"
                  type="tel"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-email">Email</FieldLabel>
                <Input
                  id="patient-email"
                  type="email"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AddressSection({
  control,
  setValue,
}: {
  control: Control<PatientFormValues>;
  setValue: UseFormSetValue<PatientFormValues>;
}) {
  const countriesQuery = useCountriesQuery();
  const countries = countriesQuery.data ?? [];

  const countryId = useWatch({ control, name: 'countryId' });
  const statesQuery = useStatesQuery(countryId ?? null);
  const states = statesQuery.data ?? [];

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Address</CardTitle>
        <CardDescription>Where this Patient can be found or reached by mail.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="addressLine1"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-address-1">Address line 1</FieldLabel>
                  <Input id="patient-address-1" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="addressLine2"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-address-2">Address line 2</FieldLabel>
                  <Input id="patient-address-2" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Controller
              control={control}
              name="city"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-city">City</FieldLabel>
                  <Input id="patient-city" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="countryId"
              render={({ field, fieldState }) => (
                <div>
                  <MasterSelect
                    id="patient-country"
                    label="Country"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      // Country changed — the previously selected State (if any) may no
                      // longer belong to it, so clear it rather than leave a stale pairing.
                      setValue('stateId', undefined);
                    }}
                    options={countries}
                    loading={countriesQuery.isLoading}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="stateId"
              render={({ field, fieldState }) => (
                <div>
                  <MasterSelect
                    id="patient-state"
                    label="State"
                    value={field.value}
                    onChange={field.onChange}
                    options={states}
                    loading={statesQuery.isLoading}
                    disabled={!countryId}
                    placeholder={!countryId ? 'Select a Country first' : 'Not specified'}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="postalCode"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-postal-code">Postal code</FieldLabel>
                  <Input id="patient-postal-code" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function IdentifiersSection({ control }: { control: Control<PatientFormValues> }) {
  const nationalitiesQuery = useNationalitiesQuery();
  const languagesQuery = useLanguagesQuery();
  const religionsQuery = useReligionsQuery();

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Identifiers</CardTitle>
        <CardDescription>
          Reference details used for care planning and government identification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="nationalityId"
              render={({ field }) => (
                <MasterSelect
                  id="patient-nationality"
                  label="Nationality"
                  value={field.value}
                  onChange={field.onChange}
                  options={nationalitiesQuery.data ?? []}
                  loading={nationalitiesQuery.isLoading}
                />
              )}
            />

            <Controller
              control={control}
              name="languageId"
              render={({ field }) => (
                <MasterSelect
                  id="patient-language"
                  label="Preferred language"
                  value={field.value}
                  onChange={field.onChange}
                  options={languagesQuery.data ?? []}
                  loading={languagesQuery.isLoading}
                />
              )}
            />

            <Controller
              control={control}
              name="religionId"
              render={({ field }) => (
                <MasterSelect
                  id="patient-religion"
                  label="Religion"
                  value={field.value}
                  onChange={field.onChange}
                  options={religionsQuery.data ?? []}
                  loading={religionsQuery.isLoading}
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="govtIdType"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-govt-id-type">Government ID type</FieldLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
                  >
                    <SelectTrigger
                      id="patient-govt-id-type"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not specified</SelectItem>
                      {PATIENT_GOVT_ID_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="govtIdNumber"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="patient-govt-id-number">Government ID number</FieldLabel>
                  <Input id="patient-govt-id-number" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function EmergencyContactSection({ control }: { control: Control<PatientFormValues> }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Emergency contact</CardTitle>
        <CardDescription>The person to reach on this Patient&apos;s behalf.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="emergencyContactName"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-ec-name">Name</FieldLabel>
                <Input id="patient-ec-name" {...field} aria-invalid={fieldState.invalid} />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="emergencyContactRelationship"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-ec-relationship">Relationship</FieldLabel>
                <Input id="patient-ec-relationship" {...field} aria-invalid={fieldState.invalid} />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="emergencyContactPhone"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="patient-ec-phone">Phone</FieldLabel>
                <Input
                  id="patient-ec-phone"
                  type="tel"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error ? (
                  <p className="text-destructive text-xs">{fieldState.error.message}</p>
                ) : null}
              </Field>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type PatientFormProps = {
  mode: 'create' | 'edit';
  mrn?: string;
  defaultValues: PatientFormValues;
  onSave: (values: PatientFormValues) => Promise<void>;
  isSaving: boolean;
  onCancel: () => void;
};

export function PatientForm({
  mode,
  mrn,
  defaultValues,
  onSave,
  isSaving,
  onCancel,
}: PatientFormProps) {
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const form = useForm<PatientFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      await onSave(values);
    } catch (error) {
      const errors = getApiErrors(error);
      const govtIdConflict = errors.find((message) =>
        message.toLowerCase().includes('government id')
      );

      if (govtIdConflict) {
        form.setError('govtIdNumber', { message: govtIdConflict });
      } else {
        setServerErrors(errors);
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {serverErrors.length > 0 ? <FormErrors errors={serverErrors} /> : null}

      {mrn ? (
        <Card className="shadow-fluent-2">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-muted-foreground text-sm">Medical Record Number</span>
            <span className="font-mono text-sm font-medium">{mrn}</span>
          </CardContent>
        </Card>
      ) : null}

      <DemographicsSection control={form.control} />
      <ContactSection control={form.control} />
      <AddressSection control={form.control} setValue={form.setValue} />
      <IdentifiersSection control={form.control} />
      <EmergencyContactSection control={form.control} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
          {mode === 'create' ? <UserRoundPlus className="size-4" /> : <Save className="size-4" />}
          {mode === 'create' ? 'Register patient' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
