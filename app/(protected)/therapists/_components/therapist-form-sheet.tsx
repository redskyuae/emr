'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrors } from '@/app/queries/api-error';
import { useCreateTherapist } from '@/app/queries/therapists/useCreateTherapist';
import { useUpdateTherapist } from '@/app/queries/therapists/useUpdateTherapist';
import { useTherapistSkillsQuery } from '@/app/queries/therapist-skills/useTherapistSkills';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { therapistFormSchema, type TherapistFormValues } from '../_utils/therapist-form-schema';
import {
  buildCreateTherapistRequest,
  buildUpdateTherapistRequest,
  EMPTY_THERAPIST_FORM_VALUES,
  therapistToFormValues,
} from '../_utils/therapist-form-values';

type Props = { open: boolean; therapist: Therapist | null; onClose: () => void };

export function TherapistFormSheet({ open, therapist, onClose }: Props) {
  const isCreating = therapist === null;
  const form = useForm<TherapistFormValues>({
    resolver: zodResolver(therapistFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_THERAPIST_FORM_VALUES,
  });
  const createMutation = useCreateTherapist();
  const updateMutation = useUpdateTherapist();
  const skillsQuery = useTherapistSkillsQuery({ page: 1, limit: 999 });

  useEffect(() => {
    if (open)
      form.reset(isCreating ? EMPTY_THERAPIST_FORM_VALUES : therapistToFormValues(therapist));
  }, [form, isCreating, open, therapist]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(buildCreateTherapistRequest(values));
        toast.success('Therapist created.');
      } else {
        await updateMutation.mutateAsync({
          id: therapist.id,
          request: buildUpdateTherapistRequest(values),
        });
        toast.success('Therapist updated.');
      }
      onClose();
    } catch (error) {
      for (const message of getApiErrors(error)) form.setError('root.server', { message });
    }
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isCreating ? 'Add Therapist' : `Edit ${therapist.name}`}</SheetTitle>
          <SheetDescription>
            Manage the Staff-backed Therapist profile and optional Ayurvedic skills.
          </SheetDescription>
        </SheetHeader>
        <form className="space-y-5 px-4 pb-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="therapist-name">Name</FieldLabel>
              <Input id="therapist-name" {...form.register('name')} />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="therapist-email">Email</FieldLabel>
              <Input
                id="therapist-email"
                type="email"
                disabled={!isCreating}
                {...form.register('email')}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            {isCreating ? (
              <Field>
                <FieldLabel htmlFor="therapist-password">Initial password</FieldLabel>
                <Input id="therapist-password" type="password" {...form.register('password')} />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="therapist-phone">Phone</FieldLabel>
                <Input id="therapist-phone" {...form.register('phone')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="therapist-staff-code">Staff code</FieldLabel>
                <Input id="therapist-staff-code" {...form.register('staffCode')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="therapist-designation">Designation</FieldLabel>
                <Input id="therapist-designation" {...form.register('designation')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="therapist-registration">Registration number</FieldLabel>
                <Input id="therapist-registration" {...form.register('registrationNumber')} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="therapist-gender">Gender</FieldLabel>
                <select
                  id="therapist-gender"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  {...form.register('gender', { setValueAs: (value) => value || undefined })}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="therapist-dob">Date of birth</FieldLabel>
                <Input id="therapist-dob" type="date" {...form.register('dateOfBirth')} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="therapist-qualifications">Qualifications</FieldLabel>
              <Textarea id="therapist-qualifications" {...form.register('qualifications')} />
            </Field>
            <Field>
              <FieldLabel>
                Therapist Skills <span className="text-muted-foreground text-xs">(optional)</span>
              </FieldLabel>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                {skillsQuery.data?.data.map((skill) => (
                  <label key={skill.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={skill.id}
                      checked={form.watch('therapistSkillIds').includes(skill.id)}
                      onChange={(event) => {
                        const current = form.getValues('therapistSkillIds');
                        form.setValue(
                          'therapistSkillIds',
                          event.target.checked
                            ? [...current, skill.id]
                            : current.filter((id) => id !== skill.id),
                          { shouldDirty: true, shouldTouch: true }
                        );
                      }}
                    />
                    {skill.name}
                  </label>
                ))}
              </div>
            </Field>
            {form.formState.errors.root?.server ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.server.message}
              </p>
            ) : null}
          </FieldGroup>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Therapist'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
