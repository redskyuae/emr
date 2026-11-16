'use client';

import { Fragment, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAyurvedaDiagnosisCodesQuery } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useSaveVisitDiagnoses } from '@/app/queries/visits/useSaveVisitDiagnoses';
import { useVisitDiagnosesQuery } from '@/app/queries/visits/useVisitDiagnoses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

import {
  draftKey,
  setPrimaryDiagnosis,
  setSecondaryDiagnoses,
  toDiagnosisDrafts,
  toSaveVisitDiagnosesRequest,
  type DiagnosisCodeSystem,
  type DiagnosisDraft,
  type DiagnosisOption,
} from '../_utils/visit-diagnoses';

/** `edit` for an Active Visit, `amend` for a Completed one, otherwise read-only. */
export type VisitDiagnosesMode = 'edit' | 'amend' | 'read';

const SEARCH_LIMIT = 20;

const SYSTEMS: Record<
  DiagnosisCodeSystem,
  { title: string; slug: string; searchHint: string; primaryHint: string }
> = {
  ICD10CM: {
    title: 'ICD-10-CM',
    slug: 'icd',
    searchHint: 'Search by ICD-10-CM code or title',
    primaryHint: 'Reported as the Principal diagnosis on insurance claims.',
  },
  AYURVEDA: {
    title: 'Ayurveda',
    slug: 'ayurveda',
    searchHint: 'Search by code or Roga',
    primaryHint: 'The Pradhana Roga treated in this Visit.',
  },
};

function optionLabel(option: Pick<DiagnosisOption, 'code' | 'title'>) {
  return `${option.code} — ${option.title}`;
}

/** Server-searched options for one code system, with the chosen codes always selectable. */
function useCodeOptions(codeSystem: DiagnosisCodeSystem, search: string) {
  const [debounced] = useDebouncedValue(search, { wait: 300 });
  const query = debounced || undefined;
  // Each dropdown searches only its own master.
  const icd = useDiagnosisCodesQuery(
    { query, limit: SEARCH_LIMIT },
    { enabled: codeSystem === 'ICD10CM' }
  );
  const ayurveda = useAyurvedaDiagnosisCodesQuery(
    { query, limit: SEARCH_LIMIT },
    { enabled: codeSystem === 'AYURVEDA' }
  );
  const active = codeSystem === 'ICD10CM' ? icd : ayurveda;
  const options: DiagnosisOption[] =
    codeSystem === 'ICD10CM'
      ? (icd.data?.data ?? []).map((item) => ({
          codeId: item.id,
          codeSystem,
          code: item.code,
          title: item.title,
          englishName: null,
          icdMapping: null,
        }))
      : (ayurveda.data?.data ?? []).map((item) => ({
          codeId: item.id,
          codeSystem,
          code: item.code,
          title: item.name,
          englishName: item.englishName,
          icdMapping: item.icdDiagnosisCode,
        }));

  return { options, fetching: active.isFetching, error: active.isError };
}

function CodeSystemFields({
  codeSystem,
  drafts,
  onChange,
}: {
  codeSystem: DiagnosisCodeSystem;
  drafts: DiagnosisDraft[];
  onChange: (next: (current: DiagnosisDraft[]) => DiagnosisDraft[]) => void;
}) {
  const system = SYSTEMS[codeSystem];
  const [primarySearch, setPrimarySearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  const primaryOptions = useCodeOptions(codeSystem, primarySearch);
  const secondaryOptions = useCodeOptions(codeSystem, secondarySearch);
  const anchor = useComboboxAnchor();

  const rows = drafts.filter((draft) => draft.codeSystem === codeSystem);
  const primary = rows.find((draft) => draft.diagnosisType === 'PRINCIPAL') ?? null;
  const secondaries = rows.filter((draft) => draft.diagnosisType === 'SECONDARY');

  // Labels are what the dropdowns hold; this map turns a label back into its code.
  const byLabel = new Map<string, DiagnosisOption>();
  for (const option of [...rows, ...primaryOptions.options, ...secondaryOptions.options]) {
    byLabel.set(optionLabel(option), option);
  }
  const primaryLabel = primary ? optionLabel(primary) : null;
  const secondaryLabels = secondaries.map(optionLabel);
  const primaryItems = [
    ...new Set([
      ...(primaryLabel ? [primaryLabel] : []),
      ...primaryOptions.options.map(optionLabel),
    ]),
  ];
  const secondaryItems = [
    ...new Set([...secondaryLabels, ...secondaryOptions.options.map(optionLabel)]),
  ].filter((label) => label !== primaryLabel);

  return (
    <section aria-label={system.title} className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {system.title}
      </h4>

      <Field>
        <FieldLabel htmlFor={`diagnosis-${system.slug}-primary`}>Primary diagnosis</FieldLabel>
        <Combobox<string>
          items={primaryItems}
          value={primaryLabel}
          onValueChange={(label) =>
            onChange((current) =>
              setPrimaryDiagnosis(current, codeSystem, label ? (byLabel.get(label) ?? null) : null)
            )
          }
          onInputValueChange={setPrimarySearch}
        >
          <ComboboxInput
            id={`diagnosis-${system.slug}-primary`}
            className="w-full"
            placeholder={system.searchHint}
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {primaryOptions.fetching ? 'Searching…' : 'No codes found.'}
            </ComboboxEmpty>
            <ComboboxList>
              {primaryItems.map((label) => (
                <ComboboxItem key={label} value={label}>
                  {label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldDescription>
          {primary?.codeSystem === 'AYURVEDA'
            ? primary.icdMapping
              ? `Claims as ${optionLabel(primary.icdMapping)}.`
              : 'No ICD-10-CM mapping for claims.'
            : system.primaryHint}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor={`diagnosis-${system.slug}-secondary`}>Secondary diagnoses</FieldLabel>
        <Combobox<string, true>
          multiple
          items={secondaryItems}
          value={secondaryLabels}
          disabled={!primary}
          onValueChange={(labels) =>
            onChange((current) =>
              setSecondaryDiagnoses(
                current,
                codeSystem,
                labels.flatMap((label) => byLabel.get(label) ?? [])
              )
            )
          }
          onInputValueChange={setSecondarySearch}
        >
          <ComboboxChips ref={anchor} className="w-full">
            <ComboboxValue>
              {(values: string[]) => (
                <Fragment>
                  {values.map((label) => (
                    <ComboboxChip key={label} aria-label={label}>
                      <span className="font-mono">{byLabel.get(label)?.code ?? label}</span>
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    id={`diagnosis-${system.slug}-secondary`}
                    placeholder={
                      primary
                        ? values.length
                          ? 'Add more'
                          : system.searchHint
                        : 'Choose the Primary diagnosis first'
                    }
                  />
                </Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>
              {secondaryOptions.fetching ? 'Searching…' : 'No codes found.'}
            </ComboboxEmpty>
            <ComboboxList>
              {secondaryItems.map((label) => (
                <ComboboxItem key={label} value={label}>
                  {label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>

      {primaryOptions.error || secondaryOptions.error ? (
        <p className="text-destructive text-sm">{system.title} codes could not be loaded.</p>
      ) : null}
    </section>
  );
}

function CodeSystemSummary({
  codeSystem,
  drafts,
}: {
  codeSystem: DiagnosisCodeSystem;
  drafts: DiagnosisDraft[];
}) {
  const system = SYSTEMS[codeSystem];
  const rows = drafts.filter((draft) => draft.codeSystem === codeSystem);
  const primary = rows.find((draft) => draft.diagnosisType === 'PRINCIPAL');
  const secondaries = rows.filter((draft) => draft.diagnosisType === 'SECONDARY');

  return (
    <section aria-label={system.title} className="space-y-2 text-sm">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {system.title}
      </h4>
      {primary ? (
        <div className="space-y-0.5">
          <p className="flex flex-wrap items-center gap-2">
            <Badge>Primary</Badge>
            <span className="font-mono font-medium">{primary.code}</span>
            <span className="[overflow-wrap:anywhere]">{primary.title}</span>
          </p>
          {primary.englishName ? (
            <p className="text-muted-foreground text-xs">{primary.englishName}</p>
          ) : null}
          {primary.codeSystem === 'AYURVEDA' && primary.icdMapping ? (
            <p className="text-muted-foreground text-xs">
              Claims as <span className="font-mono">{primary.icdMapping.code}</span>{' '}
              {primary.icdMapping.title}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground">None recorded.</p>
      )}
      {secondaries.length ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Secondary</p>
          <ul className="flex flex-wrap gap-1.5">
            {secondaries.map((draft) => (
              <li key={draftKey(draft)}>
                <Badge variant="outline" title={draft.title}>
                  <span className="font-mono">{draft.code}</span> {draft.title}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * The coded diagnoses for this Visit: ICD-10-CM for claims and, where the clinic
 * practises Ayurveda, the Ayurveda diagnosis. Each code system has one Primary and any
 * number of Secondary diagnoses.
 */
export function VisitDiagnosesPanel({
  visit,
  mode,
  showAyurveda,
}: {
  visit: Visit;
  mode: VisitDiagnosesMode;
  showAyurveda: boolean;
}) {
  const diagnosesQuery = useVisitDiagnosesQuery(visit.id);
  const saveMutation = useSaveVisitDiagnoses();
  const [draft, setDraft] = useState<DiagnosisDraft[] | null>(null);
  const editable = mode !== 'read';
  const saved = toDiagnosisDrafts(diagnosesQuery.data ?? []);
  const drafts = draft ?? saved;
  const systems: DiagnosisCodeSystem[] =
    showAyurveda || drafts.some((item) => item.codeSystem === 'AYURVEDA')
      ? ['ICD10CM', 'AYURVEDA']
      : ['ICD10CM'];

  function change(next: (current: DiagnosisDraft[]) => DiagnosisDraft[]) {
    setDraft((current) => next(current ?? saved));
  }

  async function save() {
    try {
      await saveMutation.mutateAsync({
        visitId: visit.id,
        amend: mode === 'amend',
        request: toSaveVisitDiagnosesRequest(drafts),
      });
      setDraft(null);
      toast.success(mode === 'amend' ? 'Diagnoses amended.' : 'Diagnoses saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <section
      aria-labelledby="visit-diagnoses"
      className="border-l-primary space-y-4 rounded-lg border border-l-4 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="visit-diagnoses" className="text-sm font-semibold">
          Coded diagnoses
        </h3>
        {mode === 'amend' ? <Badge variant="outline">Amending a Completed Visit</Badge> : null}
      </div>

      {diagnosesQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading diagnoses">
          {systems.map((system) => (
            <div key={system} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : diagnosesQuery.isError ? (
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-destructive text-sm">Diagnoses could not be loaded.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void diagnosesQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {systems.map((system) =>
              editable ? (
                <CodeSystemFields
                  key={system}
                  codeSystem={system}
                  drafts={drafts}
                  onChange={change}
                />
              ) : (
                <CodeSystemSummary key={system} codeSystem={system} drafts={drafts} />
              )
            )}
          </div>
          {editable ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {draft ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saveMutation.isPending}
                  onClick={() => setDraft(null)}
                >
                  Discard changes
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={!draft || saveMutation.isPending}
                aria-busy={saveMutation.isPending}
                onClick={() => void save()}
              >
                <Save className="size-4" />
                {saveMutation.isPending
                  ? 'Saving…'
                  : mode === 'amend'
                    ? 'Save amendment'
                    : 'Save diagnoses'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
