'use client';

import { type RefObject, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';

import { useAyurvedaDiagnosisCodesQuery } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

const OPTION_LIMIT = 50;

export type DiagnosisCodeOption = {
  id?: number;
  code: string;
  title: string;
};

type PickerProps = {
  id?: string;
  label: string;
  value: DiagnosisCodeOption | null;
  disabled?: boolean;
  portalContainer?: RefObject<HTMLElement | null>;
  onChange: (option: DiagnosisCodeOption | null) => void;
};

function optionLabel(option: DiagnosisCodeOption) {
  return `${option.code} · ${option.title}`;
}

function CodeCombobox({
  id,
  label,
  value,
  disabled,
  portalContainer,
  onChange,
  onSearch,
  options,
  isFetching,
  isError,
  noun,
}: PickerProps & {
  noun: string;
  isError: boolean;
  isFetching: boolean;
  options: DiagnosisCodeOption[];
  onSearch: (search: string) => void;
}) {
  return (
    <>
      <Combobox<DiagnosisCodeOption>
        items={options}
        value={value}
        disabled={disabled}
        itemToStringLabel={optionLabel}
        itemToStringValue={(option) => option.code}
        isItemEqualToValue={(item, selected) => item.code === selected.code}
        onValueChange={onChange}
        // Selecting an option writes its label into the input before `value` updates, so match
        // against the options too: that text is not a search term.
        onInputValueChange={(text) => {
          const isLabel = [...options, ...(value ? [value] : [])].some(
            (option) => optionLabel(option) === text
          );
          onSearch(isLabel ? '' : text);
        }}
      >
        <ComboboxInput
          id={id}
          aria-label={label}
          className="w-full"
          disabled={disabled}
          placeholder={`Search ${noun} by code or title`}
          showClear
        />
        <ComboboxContent portalContainer={portalContainer}>
          <ComboboxEmpty>{isFetching ? `Searching ${noun}…` : `No ${noun} found.`}</ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option.code} value={option}>
                <span>
                  <span className="block font-medium">{option.title}</span>
                  <span className="text-muted-foreground block font-mono text-xs">
                    {option.code}
                  </span>
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {isError ? <p className="text-destructive text-sm">{noun} could not be loaded.</p> : null}
    </>
  );
}

export function DiagnosisCodePicker(props: PickerProps) {
  const [search, setSearch] = useState('');
  const [query] = useDebouncedValue(search, { wait: 300 });
  const codes = useDiagnosisCodesQuery({
    query: query || undefined,
    isActive: true,
    limit: OPTION_LIMIT,
  });

  return (
    <CodeCombobox
      {...props}
      noun="Diagnosis Codes"
      options={codes.data?.data ?? []}
      isFetching={codes.isFetching}
      isError={codes.isError}
      onSearch={setSearch}
    />
  );
}

export function AyurvedaDiagnosisCodePicker(props: PickerProps) {
  const [search, setSearch] = useState('');
  const [query] = useDebouncedValue(search, { wait: 300 });
  const codes = useAyurvedaDiagnosisCodesQuery({
    query: query || undefined,
    isActive: true,
    limit: OPTION_LIMIT,
  });

  return (
    <CodeCombobox
      {...props}
      noun="Ayurveda Diagnosis Codes"
      options={codes.data?.data ?? []}
      isFetching={codes.isFetching}
      isError={codes.isError}
      onSearch={setSearch}
    />
  );
}
