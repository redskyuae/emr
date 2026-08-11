'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCountryOptionsQuery } from '@/app/queries/global-references/countries/useCountries';
import type { SaveStateRequest } from '@/app/api/v1/states/types';
import { type State } from '@/app/queries/global-references/states/useStates';
import { useCreateState } from '@/app/queries/global-references/states/useCreateState';
import { useUpdateState } from '@/app/queries/global-references/states/useUpdateState';
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
import { stateFormSchema, type StateFormValues } from '../../_utils/state-form-schema';

const EMPTY_DEFAULTS: StateFormValues = {
  name: '',
  countryId: '',
};

function hasCountryId(record: State): record is State & { countryId: number } {
  return 'countryId' in record;
}

export function StateFormSheet({
  open,
  mode,
  recordId,
  record,
  isResolving,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  recordId: number | null;
  record: State | null;
  isResolving: boolean;
  onClose: () => void;
}) {
  const createMutation = useCreateState();
  const updateMutation = useUpdateState();
  const countriesQuery = useCountryOptionsQuery();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<StateFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(stateFormSchema),
  });

  const countries = countriesQuery.data ?? [];
  const isCreating = mode === 'new';
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sessionKey = isCreating ? 'new' : recordId === null ? null : String(recordId);
  const hasNoCountries =
    !countriesQuery.isLoading && !countriesQuery.isError && countries.length === 0;

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
      countryId: record && hasCountryId(record) ? String(record.countryId) : '',
    });
  }, [open, sessionKey, isResolving, record, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: SaveStateRequest = {
      name: values.name,
      countryId: Number(values.countryId),
    };

    try {
      if (isCreating) {
        await createMutation.mutateAsync(request);
        toast.success('State created.');
        onClose();
        return;
      }

      if (recordId === null) {
        return;
      }

      await updateMutation.mutateAsync({
        id: recordId,
        request,
      });
      toast.success('State updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const sheetTitle = isCreating ? 'Add State' : `Edit ${record?.name ?? 'State'}`;
  const sheetDescription = isCreating ? 'Create a new State.' : 'Update the State details.';

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
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        ) : (
          <form
            id="state-form"
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

              {countriesQuery.isError ? (
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
                      <FieldLabel htmlFor="state-name">
                        Name{' '}
                        <span aria-hidden="true" className="text-destructive">
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id="state-name"
                        {...field}
                        disabled={isSaving}
                        maxLength={100}
                        placeholder="e.g. Tamil Nadu"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="countryId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="state-country">
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
                          id="state-country"
                          className="w-full"
                          aria-required="true"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue
                            placeholder={
                              countriesQuery.isLoading ? 'Loading Countries...' : 'Select a Country'
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
