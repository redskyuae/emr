'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { AlertCircle, Save } from 'lucide-react';
import type { AllergenCategory } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
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

export type AllergenFormValues = {
  name: string;
  code: string;
  category: AllergenCategory;
};

const ALLERGEN_CATEGORY_OPTIONS: { value: AllergenCategory; label: string }[] = [
  { value: 'drug', label: 'Drug' },
  { value: 'food', label: 'Food' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'other', label: 'Other' },
];

export function AllergenFormSheet({
  open,
  onClose,
  isCreating,
  editingName,
  form,
  serverErrors,
  isSaving,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  isCreating: boolean;
  editingName: string | null;
  form: UseFormReturn<AllergenFormValues>;
  serverErrors: string[];
  isSaving: boolean;
  onSave: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">
            {isCreating ? 'Add Allergen' : `Edit ${editingName ?? 'Allergen'}`}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Add an Allergen to this Tenant catalogue.'
              : 'Update the Allergen details.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4">
            {serverErrors.length > 0 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {serverErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup className="gap-4">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="allergen-name">
                  Name{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="allergen-name"
                  {...register('name')}
                  disabled={isSaving}
                  maxLength={150}
                  placeholder="e.g. Penicillin"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="allergen-code">
                  Code{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  id="allergen-code"
                  {...register('code', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                  disabled={isSaving}
                  maxLength={20}
                  placeholder="e.g. PEN"
                  className="font-mono"
                  aria-required="true"
                  aria-invalid={!!errors.code}
                />
                <FieldError errors={[errors.code]} />
              </Field>

              <Controller
                control={control}
                name="category"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="allergen-category">
                      Category{' '}
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <SelectTrigger
                        id="allergen-category"
                        className="w-full"
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLERGEN_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
      </SheetContent>
    </Sheet>
  );
}
