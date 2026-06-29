'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateRole } from '@/app/queries/identity-access/useCreateRole';
import { usePermissionsQuery } from '@/app/queries/identity-access/usePermissions';
import { useRolePermissionsQuery } from '@/app/queries/identity-access/useRolePermissions';
import { useSetRolePermissions } from '@/app/queries/identity-access/useSetRolePermissions';
import { useUpdateRole } from '@/app/queries/identity-access/useUpdateRole';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCount } from '@/lib/format-count';

import { PermissionMatrix } from '../permission-matrix';
import { RoleIcon } from '../role-icon';
import { buildPermissionSections } from '../../_utils/permission-sections';
import { buildRoleCode } from '../../_utils/role-code';
import { roleFormSchema, type RoleFormValues } from '../../_utils/role-form-schema';
import { PermissionMatrixSkeleton } from '@/app/(protected)/identity-access/roles/_components/_sheets/permission-matrix-skeleton';

const EMPTY_DEFAULTS: RoleFormValues = {
  name: '',
  code: '',
  description: '',
  permissionIds: [],
};

type RoleFormSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: 'new' | 'edit';
  roleId: number | null;
  roleResolving: boolean;
  role: RoleWithStats | null;
  onSwitchToEdit: (roleId: number) => void;
};

export function RoleFormSheet({
  open,
  mode,
  roleId,
  role,
  onClose,
  roleResolving,
  onSwitchToEdit,
}: RoleFormSheetProps) {
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const permissionsQuery = usePermissionsQuery();

  const setRolePermissionsMutation = useSetRolePermissions();
  const rolePermissionsQuery = useRolePermissionsQuery(mode === 'edit' ? roleId : null);

  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const initializedKeyRef = useRef<string | null>(null);

  const form = useForm<RoleFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_DEFAULTS,
    resolver: zodResolver(roleFormSchema),
  });

  const isCreating = mode === 'new';
  const isSaving =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    setRolePermissionsMutation.isPending;

  const permissionSections = useMemo(
    () => buildPermissionSections(permissionsQuery.data),
    [permissionsQuery.data]
  );

  const roleReady = isCreating ? true : role !== null;
  const permissionsReady = isCreating ? true : rolePermissionsQuery.data !== undefined;
  const sessionKey = isCreating ? 'new' : roleId === null ? null : String(roleId);

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    if (sessionKey === null || !roleReady || !permissionsReady) {
      return;
    }

    if (initializedKeyRef.current === sessionKey) {
      return;
    }

    initializedKeyRef.current = sessionKey;
    setServerErrors([]);
    setCodeManuallyEdited(false);
    form.reset({
      name: role?.name ?? '',
      code: role?.code ?? '',
      description: role?.description ?? '',
      permissionIds: isCreating
        ? []
        : (rolePermissionsQuery.data?.map((permission) => permission.id) ?? []),
    });
  }, [
    open,
    sessionKey,
    roleReady,
    permissionsReady,
    role,
    rolePermissionsQuery.data,
    isCreating,
    form,
  ]);

  const showFormSkeleton = roleResolving || !roleReady || !permissionsReady;

  const showPermissionSkeleton =
    permissionsQuery.isLoading ||
    (mode === 'edit' && rolePermissionsQuery.isLoading && !rolePermissionsQuery.data);

  const onSubmit = form.handleSubmit(async (values) => {
    const description = values.description.trim();
    const permissionIds = values.permissionIds;
    setServerErrors([]);

    try {
      if (isCreating) {
        const createdRole = await createRoleMutation.mutateAsync({
          name: values.name,
          code: values.code,
          description: description || undefined,
        });

        try {
          await setRolePermissionsMutation.mutateAsync({
            roleId: createdRole.data.id,
            request: { permissionIds },
          });
        } catch (error) {
          setServerErrors(getApiErrors(error));
          toast.error(getApiErrorMessage(error));
          onSwitchToEdit(createdRole.data.id);
          return;
        }

        toast.success('Role created.');
        onClose();
        return;
      }

      if (roleId === null) {
        return;
      }

      await updateRoleMutation.mutateAsync({
        roleId,
        request: { name: values.name, description: description || null },
      });
      await setRolePermissionsMutation.mutateAsync({
        roleId,
        request: { permissionIds },
      });
      toast.success('Role updated.');
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const drawerTitle = isCreating ? 'New Role' : (role?.name ?? 'Role');
  const drawerDescription = isCreating
    ? 'Create a Tenant Role and choose Permission Assignments.'
    : role?.isSystem
      ? 'System Role · editable, but cannot be deleted.'
      : 'Tenant Role · edit details and Permission Assignments.';

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
      >
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <RoleIcon isSystem={role?.isSystem ?? false} />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-xl">{drawerTitle}</SheetTitle>
                {role?.isSystem ? (
                  <Badge variant="outline" className="bg-muted/70 uppercase">
                    System
                  </Badge>
                ) : null}
              </div>
              <SheetDescription>{drawerDescription}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {showFormSkeleton ? (
          <div className="flex-1 space-y-6 p-4">
            <PermissionMatrixSkeleton />
          </div>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <form id="role-form" onSubmit={onSubmit} className="space-y-6 p-4">
                {serverErrors.length > 0 ? (
                  <Alert variant="destructive">
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <Field className="md:col-span-2">
                          <FieldLabel htmlFor="role-name">
                            Role name{' '}
                            <span aria-hidden="true" className="text-destructive">
                              {' '}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id="role-name"
                            {...field}
                            onChange={(event) => {
                              field.onChange(event);
                              if (isCreating && !codeManuallyEdited) {
                                form.setValue('code', buildRoleCode(event.target.value), {
                                  shouldValidate: form.formState.isSubmitted,
                                });
                              }
                            }}
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

                    <Field>
                      <FieldLabel>Assigned Staff</FieldLabel>
                      <div className="flex min-h-9 items-center">
                        <Badge variant="outline" className="bg-muted/70 font-mono">
                          {formatCount(role?.assignedStaffCount ?? 0, 'staff member')}
                        </Badge>
                      </div>
                    </Field>
                  </div>

                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="role-code">
                          Role code{' '}
                          <span aria-hidden="true" className="text-destructive">
                            {' '}
                            *{' '}
                          </span>
                        </FieldLabel>
                        <Input
                          id="role-code"
                          {...field}
                          onChange={(event) => {
                            setCodeManuallyEdited(true);
                            field.onChange(buildRoleCode(event.target.value));
                          }}
                          aria-required={true}
                          className="font-mono"
                          disabled={!isCreating || isSaving}
                          aria-invalid={fieldState.invalid}
                        />
                        <p className="text-muted-foreground text-xs">
                          {isCreating
                            ? 'Used as a stable internal code; cannot be changed later.'
                            : 'Role code cannot be changed.'}
                        </p>
                        {fieldState.error ? (
                          <p className="text-destructive text-xs">{fieldState.error.message}</p>
                        ) : null}
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="role-description">Description</FieldLabel>
                        <Textarea id="role-description" {...field} disabled={isSaving} rows={3} />
                      </Field>
                    )}
                  />
                </FieldGroup>

                <section className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Permissions</h2>
                    <p className="text-muted-foreground text-sm">
                      Permission changes are saved only when you choose Save changes.
                    </p>
                  </div>
                  {permissionsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Could not load the Permission Catalogue</AlertTitle>
                      <AlertDescription>
                        {getApiErrorMessage(permissionsQuery.error)}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {rolePermissionsQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Could not load assigned Permissions</AlertTitle>
                      <AlertDescription>
                        {getApiErrorMessage(rolePermissionsQuery.error)}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {showPermissionSkeleton ? (
                    <PermissionMatrixSkeleton />
                  ) : (
                    <Controller
                      control={form.control}
                      name="permissionIds"
                      render={({ field }) => {
                        const granted = new Set(field.value);

                        return (
                          <PermissionMatrix
                            sections={permissionSections}
                            grantedPermissionIds={granted}
                            disabled={
                              isSaving || permissionsQuery.isError || rolePermissionsQuery.isError
                            }
                            onTogglePermission={(permissionId, checked) => {
                              const next = new Set(granted);

                              if (checked) {
                                next.add(permissionId);
                              } else {
                                next.delete(permissionId);
                              }

                              field.onChange(Array.from(next));
                            }}
                          />
                        );
                      }}
                    />
                  )}
                </section>
              </form>
            </ScrollArea>

            <SheetFooter className="bg-background flex-row justify-end border-t p-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" form="role-form" disabled={isSaving} aria-busy={isSaving}>
                <Save className="size-4" />
                Save changes
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
