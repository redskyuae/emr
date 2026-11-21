// `form_validation_failed` from react-hook-form's invalid-submit callback: the names of the
// fields that failed, from the form's schema, and how many. Never the values or the messages.

import type { FieldErrors, FieldValues } from 'react-hook-form';

import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type ValidatedForm = AnalyticsEventProperties<'form_validation_failed'>['form'];

/**
 * The top-level fields with an error, sorted. A field array (`identityDocuments`) or nested
 * object counts once under its own name, and `root` (a form-level server error) is not a field.
 */
export function formValidationFailure<T extends FieldValues>(
  form: ValidatedForm,
  errors: FieldErrors<T>
): AnalyticsEventProperties<'form_validation_failed'> {
  const fields = Object.keys(errors)
    .filter((name) => name !== 'root' && errors[name] !== undefined)
    .sort();

  return { form, invalid_field_count: fields.length, invalid_fields: fields };
}
