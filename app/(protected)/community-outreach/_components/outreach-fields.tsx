'use client';

import { useId, type ComponentProps } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FieldBase<T extends FieldValues> = {
  label: string;
  hint?: string;
  name: Path<T>;
  required?: boolean;
  control: Control<T>;
};

type InputOverrides = Omit<
  ComponentProps<typeof Input>,
  'name' | 'value' | 'onChange' | 'onBlur' | 'ref' | 'id'
>;

export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function FieldFooter({ error, hint }: { error?: string; hint?: string }) {
  if (error) {
    return <p className="text-destructive text-xs">{error}</p>;
  }

  return hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null;
}

export function FormTextField<T extends FieldValues>({
  hint,
  name,
  label,
  control,
  required,
  ...inputProps
}: FieldBase<T> & InputOverrides) {
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
          <Input
            id={id}
            {...inputProps}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            onChange={field.onChange}
            value={(field.value as string | undefined) ?? ''}
            aria-required={required}
            aria-invalid={fieldState.invalid}
          />
          <FieldFooter error={fieldState.error?.message} hint={hint} />
        </Field>
      )}
    />
  );
}

export function FormTextareaField<T extends FieldValues>({
  hint,
  name,
  label,
  control,
  required,
  rows = 3,
  placeholder,
}: FieldBase<T> & { rows?: number; placeholder?: string }) {
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
          <Textarea
            id={id}
            rows={rows}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            onChange={field.onChange}
            placeholder={placeholder}
            value={(field.value as string | undefined) ?? ''}
            aria-required={required}
            aria-invalid={fieldState.invalid}
          />
          <FieldFooter error={fieldState.error?.message} hint={hint} />
        </Field>
      )}
    />
  );
}

export function FormSelectField<T extends FieldValues>({
  hint,
  name,
  label,
  control,
  options,
  disabled,
  required,
}: FieldBase<T> & {
  disabled?: boolean;
  options: Array<string | { value: string; label: string }>;
}) {
  const id = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
          <Select
            disabled={disabled}
            value={(field.value as string | undefined) ?? ''}
            onValueChange={field.onChange}
          >
            <SelectTrigger id={id} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => {
                const item = typeof option === 'string' ? { value: option, label: option } : option;

                return (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FieldFooter error={fieldState.error?.message} hint={hint} />
        </Field>
      )}
    />
  );
}

const ALL = 'all';

export function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-40" aria-label={label}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
