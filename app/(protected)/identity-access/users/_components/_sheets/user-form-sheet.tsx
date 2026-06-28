'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, type Control, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Plus, Save, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

import type { SaveStaffRequest } from '@/app/api/v1/users/types';
import type { UpdateStaffRequest } from '@/app/api/v1/users/[id]/types';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAssignStaffRoles } from '@/app/queries/identity-access/useAssignStaffRoles';
import { useCreateStaff } from '@/app/queries/identity-access/useCreateStaff';
import { useRemoveStaffRole } from '@/app/queries/identity-access/useRemoveStaffRole';
import { useStaffByIdQuery } from '@/app/queries/identity-access/useStaff';
import { useStaffRolesQuery } from '@/app/queries/identity-access/useStaffRoles';
import { useUpdateStaff } from '@/app/queries/identity-access/useUpdateStaff';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Skeleton } from '@/components/ui/skeleton';

import {
  STAFF_GENDER_OPTIONS,
  staffCreateFormSchema,
  staffEditFormSchema,
  type StaffCreateFormValues,
  type StaffEditFormValues,
} from '../../_utils/staff-form-schema';

type RoleOption = {
  id: number;
  name: string;
};

const GENDER_UNSET = 'unset';

const CREATE_DEFAULTS: StaffCreateFormValues = {
  name: '',
  email: '',
  password: '',
  roleIds: [],
  phone: '',
  staffCode: '',
  designation: '',
  gender: '',
  dateOfBirth: '',
};

const EDIT_DEFAULTS: StaffEditFormValues = {
  name: '',
  phone: '',
  staffCode: '',
  designation: '',
  gender: '',
  dateOfBirth: '',
};

type StaffProfileFieldValues = {
  name: string;
  phone: string;
  staffCode: string;
  designation: string;
  gender: '' | (typeof STAFF_GENDER_OPTIONS)[number];
  dateOfBirth: string;
};

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function ProfileFields({
  control,
  disabled,
  nameRequired,
}: {
  control: Control<StaffProfileFieldValues>;
  disabled: boolean;
  nameRequired: boolean;
}) {
  return (
    <FieldGroup className="gap-4">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="staff-name">
              Full name
              {nameRequired ? <RequiredMark /> : null}
            </FieldLabel>
            <Input
              id="staff-name"
              autoComplete="name"
              {...field}
              disabled={disabled}
              aria-required={nameRequired}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error ? (
              <p className="text-destructive text-xs">{fieldState.error.message}</p>
            ) : null}
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="staffCode"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="staff-code">Staff code</FieldLabel>
              <Input
                id="staff-code"
                {...field}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error ? (
                <p className="text-destructive text-xs">{fieldState.error.message}</p>
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={control}
          name="designation"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="staff-designation">Designation</FieldLabel>
              <Input
                id="staff-designation"
                {...field}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error ? (
                <p className="text-destructive text-xs">{fieldState.error.message}</p>
              ) : null}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="staff-phone">Phone</FieldLabel>
              <Input
                id="staff-phone"
                type="tel"
                autoComplete="tel"
                {...field}
                disabled={disabled}
              />
            </Field>
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="staff-gender">Gender</FieldLabel>
              <Select
                value={field.value || GENDER_UNSET}
                onValueChange={(value) => field.onChange(value === GENDER_UNSET ? '' : value)}
                disabled={disabled}
              >
                <SelectTrigger id="staff-gender" className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENDER_UNSET}>Not specified</SelectItem>
                  {STAFF_GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="staff-dob">Date of birth</FieldLabel>
              <Input id="staff-dob" type="date" {...field} disabled={disabled} />
            </Field>
          )}
        />
      </div>
    </FieldGroup>
  );
}

function RoleCheckboxList({
  control,
  roles,
  rolesLoading,
  disabled,
}: {
  control: Control<StaffCreateFormValues>;
  roles: RoleOption[];
  rolesLoading: boolean;
  disabled: boolean;
}) {
  return (
    <Controller
      control={control}
      name="roleIds"
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel>
            Roles
            <RequiredMark />
          </FieldLabel>
          <div role="group" aria-label="Roles" className="rounded-lg border p-1">
            {rolesLoading ? (
              <p className="text-muted-foreground p-2 text-sm">Loading Roles…</p>
            ) : roles.length === 0 ? (
              <p className="text-muted-foreground p-2 text-sm">
                No Roles available. Create a Role first.
              </p>
            ) : (
              <ScrollArea className="max-h-44">
                <div className="space-y-0.5 p-1">
                  {roles.map((role) => {
                    const checked = field.value.includes(role.id);

                    return (
                      <label
                        key={role.id}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(next) => {
                            field.onChange(
                              next === true
                                ? [...field.value, role.id]
                                : field.value.filter((id) => id !== role.id)
                            );
                          }}
                        />
                        <span>{role.name}</span>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
          {fieldState.error ? (
            <p className="text-destructive text-xs">{fieldState.error.message}</p>
          ) : null}
        </Field>
      )}
    />
  );
}

function CreateUserForm({
  roles,
  rolesLoading,
  onClose,
}: {
  roles: RoleOption[];
  rolesLoading: boolean;
  onClose: () => void;
}) {
  const createStaff = useCreateStaff();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const form = useForm<StaffCreateFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(staffCreateFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  const isSaving = createStaff.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: SaveStaffRequest = {
      name: values.name,
      email: values.email,
      password: values.password,
      roleIds: values.roleIds,
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.staffCode ? { staffCode: values.staffCode } : {}),
      ...(values.designation ? { designation: values.designation } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
    };

    try {
      await createStaff.mutateAsync(request);
      toast.success('Staff member added.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          {serverErrors.length > 0 ? <FormErrors errors={serverErrors} /> : null}

          <form id="create-user-form" onSubmit={onSubmit} className="space-y-6">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="staff-email">
                    Work email
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="staff-email"
                    type="email"
                    autoComplete="email"
                    {...field}
                    disabled={isSaving}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="staff-password">
                    Temporary password
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="staff-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...field}
                    disabled={isSaving}
                    aria-required={true}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  ) : null}
                </Field>
              )}
            />

            <ProfileFields
              control={form.control as unknown as Control<StaffProfileFieldValues>}
              disabled={isSaving}
              nameRequired
            />

            <RoleCheckboxList
              control={form.control}
              roles={roles}
              rolesLoading={rolesLoading}
              disabled={isSaving}
            />
          </form>
        </div>
      </ScrollArea>

      <SheetFooter className="bg-background flex-row justify-end border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" form="create-user-form" disabled={isSaving} aria-busy={isSaving}>
          <UserPlus className="size-4" />
          Add user
        </Button>
      </SheetFooter>
    </>
  );
}

function StaffRolesEditor({
  userId,
  roles,
  rolesLoading,
}: {
  userId: string;
  roles: RoleOption[];
  rolesLoading: boolean;
}) {
  const assignedQuery = useStaffRolesQuery(userId);
  const assignRoles = useAssignStaffRoles();
  const removeRole = useRemoveStaffRole();

  const assigned = assignedQuery.data ?? [];
  const assignedIds = new Set(assigned.map((role) => role.id));
  const assignable = roles.filter((role) => !assignedIds.has(role.id));
  const busy = assignRoles.isPending || removeRole.isPending;

  function handleAdd(value: string) {
    const roleId = Number(value);

    if (!Number.isInteger(roleId)) {
      return;
    }

    assignRoles.mutate(
      { userId, request: { roleIds: [roleId] } },
      { onError: (error) => toast.error(getApiErrorMessage(error)) }
    );
  }

  function handleRemove(roleId: number) {
    removeRole.mutate(
      { userId, roleId },
      { onError: (error) => toast.error(getApiErrorMessage(error)) }
    );
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Roles</h2>
        <p className="text-muted-foreground text-sm">
          Role changes are saved immediately. A Staff member must keep at least one Role.
        </p>
      </div>

      {assignedQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load assigned Roles</AlertTitle>
          <AlertDescription>{getApiErrorMessage(assignedQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      {assignedQuery.isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {assigned.length === 0 ? (
            <span className="text-muted-foreground text-sm">No Roles assigned.</span>
          ) : (
            assigned.map((role) => (
              <Badge key={role.id} variant="outline" className="bg-muted/70 gap-1 pr-1">
                {role.name}
                <button
                  type="button"
                  aria-label={`Remove ${role.name}`}
                  disabled={busy || assigned.length <= 1}
                  onClick={() => handleRemove(role.id)}
                  className="hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}

      <Select value="" onValueChange={handleAdd} disabled={busy || rolesLoading || assignable.length === 0}>
        <SelectTrigger className="w-full sm:w-64" aria-label="Add a Role">
          <Plus className="size-4" />
          <SelectValue
            placeholder={assignable.length === 0 ? 'All Roles assigned' : 'Add a Role'}
          />
        </SelectTrigger>
        <SelectContent>
          {assignable.map((role) => (
            <SelectItem key={role.id} value={String(role.id)}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}

function EditUserForm({
  userId,
  roles,
  rolesLoading,
  onClose,
}: {
  userId: string;
  roles: RoleOption[];
  rolesLoading: boolean;
  onClose: () => void;
}) {
  const staffQuery = useStaffByIdQuery(userId);
  const updateStaff = useUpdateStaff();
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const initializedRef = useRef(false);

  const form = useForm<StaffEditFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(staffEditFormSchema),
    defaultValues: EDIT_DEFAULTS,
  });

  const staff = staffQuery.data;

  useEffect(() => {
    if (!staff || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    form.reset({
      name: staff.name,
      phone: staff.phone ?? '',
      staffCode: staff.staffCode ?? '',
      designation: staff.designation ?? '',
      gender: staff.gender ?? '',
      dateOfBirth: staff.dateOfBirth ?? '',
    });
  }, [staff, form]);

  const isSaving = updateStaff.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerErrors([]);

    const request: UpdateStaffRequest = {
      name: values.name,
      phone: values.phone || null,
      staffCode: values.staffCode || null,
      designation: values.designation || null,
      gender: values.gender || null,
      dateOfBirth: values.dateOfBirth || null,
    };

    try {
      await updateStaff.mutateAsync({ userId, request });
      toast.success('Staff member updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  if (staffQuery.isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (staffQuery.isError || !staff) {
    return (
      <div className="flex-1 p-4">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Staff member</AlertTitle>
          <AlertDescription>{getApiErrorMessage(staffQuery.error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          {serverErrors.length > 0 ? <FormErrors errors={serverErrors} /> : null}

          <Field>
            <FieldLabel htmlFor="staff-email-readonly">Work email</FieldLabel>
            <Input id="staff-email-readonly" value={staff.email} readOnly disabled />
            <p className="text-muted-foreground text-xs">
              Email and password cannot be changed here.
            </p>
          </Field>

          <form id="edit-user-form" onSubmit={onSubmit}>
            <ProfileFields
              control={form.control as unknown as Control<StaffProfileFieldValues>}
              disabled={isSaving}
              nameRequired={false}
            />
          </form>

          <StaffRolesEditor userId={userId} roles={roles} rolesLoading={rolesLoading} />
        </div>
      </ScrollArea>

      <SheetFooter className="bg-background flex-row justify-end border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" form="edit-user-form" disabled={isSaving} aria-busy={isSaving}>
          <Save className="size-4" />
          Save changes
        </Button>
      </SheetFooter>
    </>
  );
}

function FormErrors({ errors }: { errors: string[] }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Save failed</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

type UserFormSheetProps = {
  open: boolean;
  mode: 'new' | 'edit';
  userId: string | null;
  roles: RoleOption[];
  rolesLoading: boolean;
  onClose: () => void;
};

export function UserFormSheet({
  open,
  mode,
  userId,
  roles,
  rolesLoading,
  onClose,
}: UserFormSheetProps) {
  const isCreating = mode === 'new';

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle>{isCreating ? 'Add user' : 'Edit Staff member'}</SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a Staff account for the active Tenant and assign at least one Role.'
              : 'Update profile details and manage assigned Roles.'}
          </SheetDescription>
        </SheetHeader>

        {isCreating ? (
          <CreateUserForm roles={roles} rolesLoading={rolesLoading} onClose={onClose} />
        ) : userId ? (
          <EditUserForm
            key={userId}
            userId={userId}
            roles={roles}
            rolesLoading={rolesLoading}
            onClose={onClose}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
