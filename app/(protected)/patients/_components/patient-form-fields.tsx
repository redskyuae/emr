'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const NONE = 'none';

// Inline asterisk rather than a forked FieldLabel — the themed component in
// components/ui/ is never forked. Marked aria-hidden; inputs carry aria-required.
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

type MasterSelectProps = {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  options: { id: number; name: string }[];
  loading: boolean;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
};

export function MasterSelect({
  id,
  label,
  value,
  onChange,
  options,
  loading,
  required,
  disabled,
  invalid,
  placeholder,
}: MasterSelectProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </FieldLabel>
      <Select
        value={value !== undefined ? String(value) : NONE}
        onValueChange={(next) => onChange(next === NONE ? undefined : Number(next))}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid} aria-required={required}>
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
