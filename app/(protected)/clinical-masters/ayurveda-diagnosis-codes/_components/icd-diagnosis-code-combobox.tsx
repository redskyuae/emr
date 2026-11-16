'use client';

import { useState, type RefObject } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

type IcdDiagnosisCodeOption = NonNullable<AyurvedaDiagnosisCode['icdDiagnosisCode']>;

const SEARCH_LIMIT = 50;

function formatOption(option: IcdDiagnosisCodeOption) {
  return `${option.code} — ${option.title}`;
}

// Searches the Tenant's ICD-10-CM Diagnosis Codes on the server. The currently
// mapped code stays selectable even when the search results no longer include it.
export function IcdDiagnosisCodeCombobox({
  id,
  value,
  invalid,
  mappedOption,
  portalContainer,
  onBlur,
  onChange,
}: {
  id: string;
  value: number | null;
  invalid: boolean;
  mappedOption: IcdDiagnosisCodeOption | null;
  portalContainer: RefObject<HTMLElement | null>;
  onBlur: () => void;
  onChange: (value: number | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [pickedOption, setPickedOption] = useState<IcdDiagnosisCodeOption | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const diagnosisCodesQuery = useDiagnosisCodesQuery({
    query: debouncedSearch || undefined,
    limit: SEARCH_LIMIT,
  });

  const results: IcdDiagnosisCodeOption[] = (diagnosisCodesQuery.data?.data ?? []).map(
    ({ id: optionId, code, title }) => ({ id: optionId, code, title })
  );
  const selectedOption =
    value === null
      ? null
      : ([pickedOption, mappedOption, ...results].find((option) => option?.id === value) ?? null);
  const options =
    selectedOption && !results.some((option) => option.id === selectedOption.id)
      ? [selectedOption, ...results]
      : results;

  return (
    <>
      <Combobox<IcdDiagnosisCodeOption>
        items={options}
        value={selectedOption}
        itemToStringLabel={formatOption}
        itemToStringValue={(option) => String(option.id)}
        isItemEqualToValue={(option, selected) => option.id === selected.id}
        onValueChange={(option) => {
          setPickedOption(option);
          onChange(option?.id ?? null);
        }}
        onInputValueChange={(inputValue) =>
          setSearch(selectedOption && inputValue === formatOption(selectedOption) ? '' : inputValue)
        }
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder="Search ICD-10-CM code or title"
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
          onBlur={onBlur}
          showClear
        />
        <ComboboxContent portalContainer={portalContainer}>
          <ComboboxEmpty>
            {diagnosisCodesQuery.isFetching
              ? 'Searching ICD-10-CM Diagnosis Codes…'
              : 'No ICD-10-CM Diagnosis Codes found.'}
          </ComboboxEmpty>
          <ComboboxList>
            {options.map((option) => (
              <ComboboxItem key={option.id} value={option}>
                <span>
                  <span className="block font-mono text-xs font-medium">{option.code}</span>
                  <span className="text-muted-foreground block">{option.title}</span>
                </span>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {diagnosisCodesQuery.isError ? (
        <p className="text-destructive text-sm">ICD-10-CM Diagnosis Codes could not be loaded.</p>
      ) : null}
    </>
  );
}
