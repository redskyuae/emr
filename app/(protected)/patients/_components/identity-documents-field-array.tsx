'use client';

import { Controller, type Control, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';

import { useCountriesQuery } from '@/app/queries/global-references/useCountries';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getIdentityDocumentRequiredFields,
  type PatientFormValues,
} from '../_utils/patient-form-schema';
import { PATIENT_IDENTITY_DOCUMENT_TYPE_OPTIONS } from '../_utils/patient-value-sets';
import { MasterSelect, RequiredMark } from './patient-form-fields';

// A Patient may hold several documents of the same type — a dual national holds
// two valid passports — so this is a genuine repeatable collection, not a fixed
// pair of fields. Rows carry their server id in form state (never rendered) so
// the nested full replace can diff rather than rewrite (ADR 0043).
export function IdentityDocumentsFieldArray({ control }: { control: Control<PatientFormValues> }) {
  const countriesQuery = useCountriesQuery();
  const { fields, append, remove } = useFieldArray({ control, name: 'identityDocuments' });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No identity documents recorded. Add a passport, residence visa, or other government
          document.
        </p>
      ) : null}

      {fields.map((row, index) => (
        <IdentityDocumentRow
          key={row.id}
          index={index}
          control={control}
          countries={countriesQuery.data ?? []}
          countriesLoading={countriesQuery.isLoading}
          onRemove={() => remove(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            documentType: 'passport',
            documentNumber: '',
            issuingCountryId: undefined,
            expiryDate: '',
            label: '',
          })
        }
      >
        <Plus className="size-4" />
        Add identity document
      </Button>
    </div>
  );
}

function IdentityDocumentRow({
  index,
  control,
  countries,
  countriesLoading,
  onRemove,
}: {
  index: number;
  control: Control<PatientFormValues>;
  countries: { id: number; name: string }[];
  countriesLoading: boolean;
  onRemove: () => void;
}) {
  return (
    <Controller
      control={control}
      name={`identityDocuments.${index}.documentType`}
      render={({ field: typeField }) => {
        // Which fields apply, and which are required, is driven entirely by the
        // selected type — the same table the API contract enforces.
        const required = getIdentityDocumentRequiredFields(typeField.value);
        const showIssuingCountry = typeField.value !== 'residence-visa';
        const showLabel = typeField.value === 'other';

        return (
          <div className="rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`identity-document-type-${index}`}>
                  Document type
                  <RequiredMark />
                </FieldLabel>
                <Select value={typeField.value} onValueChange={typeField.onChange}>
                  <SelectTrigger
                    id={`identity-document-type-${index}`}
                    className="w-full"
                    aria-required
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATIENT_IDENTITY_DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Controller
                control={control}
                name={`identityDocuments.${index}.documentNumber`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`identity-document-number-${index}`}>
                      Document number
                      <RequiredMark />
                    </FieldLabel>
                    <Input
                      id={`identity-document-number-${index}`}
                      aria-required
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.error ? (
                      <p className="text-destructive text-xs">{fieldState.error.message}</p>
                    ) : null}
                  </Field>
                )}
              />

              {showIssuingCountry ? (
                <Controller
                  control={control}
                  name={`identityDocuments.${index}.issuingCountryId`}
                  render={({ field, fieldState }) => (
                    <div>
                      <MasterSelect
                        id={`identity-document-country-${index}`}
                        label="Issuing country"
                        value={field.value}
                        onChange={field.onChange}
                        options={countries}
                        loading={countriesLoading}
                        required={required.issuingCountryId}
                        invalid={fieldState.invalid}
                      />
                      {fieldState.error ? (
                        <p className="text-destructive text-xs">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              ) : null}

              <Controller
                control={control}
                name={`identityDocuments.${index}.expiryDate`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`identity-document-expiry-${index}`}>
                      Expiry date
                      {required.expiryDate ? <RequiredMark /> : null}
                    </FieldLabel>
                    <Input
                      id={`identity-document-expiry-${index}`}
                      type="date"
                      aria-required={required.expiryDate}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.error ? (
                      <p className="text-destructive text-xs">{fieldState.error.message}</p>
                    ) : null}
                  </Field>
                )}
              />

              {showLabel ? (
                <Controller
                  control={control}
                  name={`identityDocuments.${index}.label`}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={`identity-document-label-${index}`}>Label</FieldLabel>
                      <Input
                        id={`identity-document-label-${index}`}
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.error ? (
                        <p className="text-destructive text-xs">{fieldState.error.message}</p>
                      ) : null}
                    </Field>
                  )}
                />
              ) : null}
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
}
