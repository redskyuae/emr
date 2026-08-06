'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCountriesQuery } from '@/app/queries/global-references/useCountries';
import {
  type CreateGlobalReferenceVariables,
  type GlobalReferenceEntity,
  type UpdateGlobalReferenceVariables,
  useCreateGlobalReference,
  useUpdateGlobalReference,
} from '@/app/queries/global-references/useGlobalReferencesManagement';
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
import type { GlobalReferenceScreenConfig } from '../global-reference-config';
import {
  createGlobalReferenceFormSchema,
  type GlobalReferenceFormValues,
} from '../global-reference-form-schema';

const EMPTY_DEFAULTS: GlobalReferenceFormValues = {
  name: '',
  code: '',
  countryId: '',
};

function hasCode(
  record: GlobalReferenceEntity
): record is GlobalReferenceEntity & { code: string } {
  return 'code' in record;
}

function hasCountryId(
  record: GlobalReferenceEntity
): record is GlobalReferenceEntity & { countryId: number } {
  return 'countryId' in record;
}

export function GlobalReferenceFormSheet({
  open,
  mode,
  recordId,
  record,
  config,
  isResolving,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  recordId: number | null;
  record: GlobalReferenceEntity | null;
  config: GlobalReferenceScreenConfig;
  isResolving: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateGlobalReference();
  const updateMutation = useUpdateGlobalReference();
  const countriesQuery = useCountriesQuery();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<GlobalReferenceFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(
      createGlobalReferenceFormSchema(config.hasCountry ? 'state' : 'name-code')
    ),
  });

  const countries = countriesQuery.data ?? [];
  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : recordId === null ? null : String(recordId);
  const hasNoCountries =
    config.hasCountry &&
    !countriesQuery.isLoading &&
    !countriesQuery.isError &&
    countries.length === 0;

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
    form.reset({
      name: record?.name ?? '',
      code: record && hasCode(record) ? record.code : '',
      countryId: record && hasCountryId(record) ? String(record.countryId) : '',
    });
  }, [open, sessionKey, isResolving, record, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: CreateGlobalReferenceVariables['request'] = config.hasCountry
      ? {
          name: values.name,
          countryId: Number(values.countryId ?? ''),
        }
      : {
          name: values.name,
          code: values.code ?? '',
        };

    try {
      if (isCreating) {
        await createMutation.mutateAsync({ resource: config.resource, request });
        toast.success(`${config.singularTitle} created.`);
        onClose();
        return;
      }

      if (recordId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: recordId,
        resource: config.resource,
        request: request as UpdateGlobalReferenceVariables['request'],
      });
      toast.success(`${config.singularTitle} updated.`);
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating
    ? config.addButtonLabel
    : `Edit ${record?.name ?? config.singularTitle}`;
  const sheetDescription = isCreating
    ? `Create a new ${config.singularTitle} Global Reference.`
    : `Update the ${config.singularTitle} Global Reference details.`;

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        {isResolving ? (
          <div className="flex-1 p-4">
            <div className="space-y-4">
              {Array.from({ length: config.hasCountry ? 2 : 3 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id={`${config.queryParam}-form`}
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
                      {serverErrors.map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {config.hasCountry && countriesQuery.isError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>Could not load Countries</AlertTitle>
                  <AlertDescription>{getApiErrorMessage(countriesQuery.error)}</AlertDescription>
                </Alert>
              ) : hasNoCountries ? (
                <Alert className="mb-4">
                  <AlertCircle className="size-4" />
                  <AlertTitle>No Countries configured</AlertTitle>
                  <AlertDescription>Create a Country before adding States.</AlertDescription>
                </Alert>
              ) : null}

              <FieldGroup className="gap-4">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`${config.queryParam}-name`}>
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id={`${config.queryParam}-name`}
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder={config.namePlaceholder}
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {config.hasCode ? (
                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`${config.queryParam}-code`}>
                          Code{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id={`${config.queryParam}-code`}
                          {...field}
                          onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                          disabled={isSaving}
                          maxLength={10}
                          placeholder={config.codePlaceholder}
                          className="font-mono"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                ) : null}

                {config.hasCountry ? (
                  <Controller
                    control={form.control}
                    name="countryId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`${config.queryParam}-country`}>
                          Country{' '}
                          <span aria-hidden="true" className="text-destructive">
                            *
                          </span>
                        </FieldLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          disabled={isSaving || countriesQuery.isLoading || hasNoCountries}
                        >
                          <SelectTrigger
                            id={`${config.queryParam}-country`}
                            className="w-full"
                            aria-required="true"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue
                              placeholder={
                                countriesQuery.isLoading
                                  ? 'Loading Countries...'
                                  : 'Select a Country'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={String(country.id)}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                ) : null}
              </FieldGroup>
            </div>

            <SheetFooter className="bg-background flex-row justify-end border-t p-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                <Save className="size-4" />
                Save
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
