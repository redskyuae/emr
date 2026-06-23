'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  KeyRound,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  GroupedPermissions,
  PermissionListItem,
} from '@/app/api/lib/modules/permission/schemas/permission-schema';
import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useCreateRole } from '@/app/queries/identity-access/useCreateRole';
import { useDeleteRole } from '@/app/queries/identity-access/useDeleteRole';
import { usePermissionsQuery } from '@/app/queries/identity-access/usePermissions';
import {
  rolePermissionsQueryKey,
  useRolePermissionsQuery,
} from '@/app/queries/identity-access/useRolePermissions';
import { rolesQueryKey, useRolesQuery } from '@/app/queries/identity-access/useRoles';
import { useSetRolePermissions } from '@/app/queries/identity-access/useSetRolePermissions';
import { useUpdateRole } from '@/app/queries/identity-access/useUpdateRole';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatCount } from '@/lib/format-count';
import { cn } from '@/lib/utils';

type ActiveRole =
  | {
      kind: 'new';
    }
  | {
      kind: 'existing';
      role: RoleWithStats;
    };

type PermissionResource = {
  id: string;
  label: string;
  permissions: PermissionListItem[];
};

type PermissionSection = {
  id: string;
  label: string;
  resources: PermissionResource[];
};

const moduleLabels: Record<string, string> = {
  'tenant-management': 'Tenant Management',
  'identity-access': 'Identity & Access',
  'appointment-masters': 'Appointment Masters',
  'global-references': 'Global References',
};

const actionLabels: Record<string, string> = {
  read: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  deactivate: 'Deactivate',
  reactivate: 'Reactivate',
  assign: 'Assign',
  replace: 'Replace',
  remove: 'Remove',
  revoke: 'Revoke',
};

function titleizeSlug(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function moduleLabel(module: string) {
  return moduleLabels[module] ?? titleizeSlug(module);
}

function resourceLabel(resource: string) {
  return titleizeSlug(resource);
}

function actionLabel(action: string) {
  return actionLabels[action] ?? titleizeSlug(action);
}

function buildRoleCode(roleName: string) {
  return roleName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildPermissionSections(groupedPermissions: GroupedPermissions | undefined) {
  if (!groupedPermissions) {
    return [];
  }

  return Object.entries(groupedPermissions).map(([module, permissions]) => {
    const resourceOrder: string[] = [];
    const permissionsByResource = new Map<string, PermissionListItem[]>();

    for (const permission of permissions) {
      if (!permissionsByResource.has(permission.resource)) {
        permissionsByResource.set(permission.resource, []);
        resourceOrder.push(permission.resource);
      }

      permissionsByResource.get(permission.resource)?.push(permission);
    }

    return {
      id: module,
      label: moduleLabel(module),
      resources: resourceOrder.map((resource) => ({
        id: resource,
        label: resourceLabel(resource),
        permissions: permissionsByResource.get(resource) ?? [],
      })),
    };
  });
}

function countSectionPermissions(section: PermissionSection) {
  return section.resources.reduce((total, resource) => total + resource.permissions.length, 0);
}

function countGrantedInSection(section: PermissionSection, grantedPermissionIds: Set<number>) {
  return section.resources.reduce(
    (sectionTotal, resource) =>
      sectionTotal +
      resource.permissions.filter((permission) => grantedPermissionIds.has(permission.id)).length,
    0
  );
}

function RoleIcon({ isSystem, className }: { isSystem: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-lg border',
        isSystem
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-chart-2/20 bg-chart-2/10 text-chart-2',
        className
      )}
    >
      <ShieldCheck className="size-5" />
    </span>
  );
}

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleWithStats;
  onEdit: (role: RoleWithStats) => void;
  onDelete: (role: RoleWithStats) => void;
}) {
  return (
    <Card className="shadow-fluent-2 hover:shadow-fluent-8 transition-shadow">
      <CardContent className="flex min-h-52 flex-col gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <RoleIcon isSystem={role.isSystem} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">{role.name}</h2>
              {role.isSystem ? (
                <Badge variant="outline" className="bg-muted/70 text-xs uppercase">
                  System
                </Badge>
              ) : null}
            </div>
            <Badge variant="outline" className="bg-muted/70 font-mono text-xs">
              {role.code}
            </Badge>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {role.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <UsersRound className="size-4" />
            {formatCount(role.assignedStaffCount, 'staff member')}
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <KeyRound className="size-4" />
            {formatCount(role.permissionAssignmentCount, 'permission')}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(role)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            {!role.isSystem ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`More actions for ${role.name}`}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit(role)}>Edit Role</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(role)}>
                    <Trash2 className="size-4" />
                    Delete Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Card key={item} className="shadow-fluent-2">
          <CardContent className="flex min-h-52 flex-col gap-4 p-4">
            <div className="flex gap-3">
              <Skeleton className="size-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <Separator />
            <div className="mt-auto flex gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PermissionMatrixSkeleton() {
  return (
    <div className="space-y-7">
      {[0, 1, 2].map((section) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center justify-between gap-3 border-b pb-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="divide-y rounded-md border">
            {[0, 1, 2].map((resource) => (
              <div key={resource} className="grid gap-3 p-3 md:grid-cols-3 md:items-start">
                <Skeleton className="h-5 w-32" />
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:col-span-2 xl:grid-cols-3">
                  {[0, 1, 2, 3].map((action) => (
                    <Skeleton key={action} className="h-7 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PermissionMatrix({
  sections,
  grantedPermissionIds,
  disabled,
  onTogglePermission,
}: {
  sections: PermissionSection[];
  grantedPermissionIds: Set<number>;
  disabled: boolean;
  onTogglePermission: (permissionId: number, checked: boolean) => void;
}) {
  if (sections.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRound />
          </EmptyMedia>
          <EmptyTitle>No Permissions in the catalogue</EmptyTitle>
          <EmptyDescription>
            The Permission Catalogue is created during Tenant Provisioning.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-7">
      {sections.map((section) => {
        const grantedCount = countGrantedInSection(section, grantedPermissionIds);
        const totalCount = countSectionPermissions(section);

        return (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b pb-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.label}
              </h3>
              <span className="text-muted-foreground font-mono text-xs font-semibold uppercase">
                {grantedCount}/{totalCount} granted
              </span>
            </div>

            <div className="divide-y rounded-md border">
              {section.resources.map((resource) => (
                <div key={resource.id} className="grid gap-3 p-3 md:grid-cols-3 md:items-start">
                  <p className="font-medium">{resource.label}</p>
                  <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:col-span-2 xl:grid-cols-3">
                    {resource.permissions.map((permission) => {
                      const checkboxId = `permission-${permission.id}`;

                      return (
                        <label
                          key={permission.id}
                          htmlFor={checkboxId}
                          className={cn(
                            'flex min-h-7 items-start gap-2 text-sm',
                            disabled ? 'text-muted-foreground' : 'cursor-pointer'
                          )}
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={grantedPermissionIds.has(permission.id)}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                              onTogglePermission(permission.id, checked === true)
                            }
                            aria-label={`${resource.label}: ${actionLabel(permission.action)}`}
                          />
                          <span className="grid gap-0.5">
                            <span>{actionLabel(permission.action)}</span>
                            {permission.description ? (
                              <span className="text-muted-foreground text-xs leading-snug">
                                {permission.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function RolesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialCreateHandledRef = useRef(false);
  const rolesQuery = useRolesQuery();
  const permissionsQuery = usePermissionsQuery();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const setRolePermissionsMutation = useSetRolePermissions();
  const [activeRole, setActiveRole] = useState<ActiveRole | null>(null);
  const [rolePendingDelete, setRolePendingDelete] = useState<RoleWithStats | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<number> | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const editingRoleId = activeRole?.kind === 'existing' ? activeRole.role.id : null;
  const rolePermissionsQuery = useRolePermissionsQuery(editingRoleId);
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const permissionSections = useMemo(
    () => buildPermissionSections(permissionsQuery.data),
    [permissionsQuery.data]
  );
  const loadedPermissionIds = useMemo(
    () => new Set(rolePermissionsQuery.data?.map((permission) => permission.id) ?? []),
    [rolePermissionsQuery.data]
  );
  const effectivePermissionIds = draftPermissionIds ?? loadedPermissionIds;
  const roleSummary = useMemo(() => {
    const systemCount = roles.filter((role) => role.isSystem).length;

    return {
      total: roles.length,
      system: systemCount,
      custom: roles.length - systemCount,
    };
  }, [roles]);
  const drawerOpen = activeRole !== null;
  const isCreating = activeRole?.kind === 'new';
  const activeExistingRole = activeRole?.kind === 'existing' ? activeRole.role : null;
  const isSaving =
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    setRolePermissionsMutation.isPending;
  const showPermissionSkeleton =
    permissionsQuery.isLoading ||
    (activeRole?.kind === 'existing' &&
      rolePermissionsQuery.isLoading &&
      !rolePermissionsQuery.data);
  const drawerTitle = isCreating ? 'New Role' : (activeExistingRole?.name ?? 'Role');
  const drawerDescription = isCreating
    ? 'Create a Tenant Role and choose Permission Assignments.'
    : activeExistingRole?.isSystem
      ? 'System Role · editable, but cannot be deleted.'
      : 'Tenant Role · edit details and Permission Assignments.';

  useEffect(() => {
    if (!initialCreateOpen || initialCreateHandledRef.current) {
      return;
    }

    initialCreateHandledRef.current = true;
    openNewRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreateOpen]);

  function resetDraft() {
    setDraftName('');
    setDraftCode('');
    setDraftDescription('');
    setCodeManuallyEdited(false);
    setDraftPermissionIds(null);
    setFormErrors([]);
  }

  function openRole(role: RoleWithStats) {
    setActiveRole({ kind: 'existing', role });
    setDraftName(role.name);
    setDraftCode(role.code);
    setDraftDescription(role.description ?? '');
    setCodeManuallyEdited(false);
    setDraftPermissionIds(null);
    setFormErrors([]);
  }

  function openNewRole() {
    resetDraft();
    setDraftPermissionIds(new Set());
    setActiveRole({ kind: 'new' });
  }

  function closeDrawer() {
    setActiveRole(null);
    resetDraft();
    router.replace('/identity-access/roles', { scroll: false });
  }

  function handleTogglePermission(permissionId: number, checked: boolean) {
    setDraftPermissionIds((currentPermissionIds) => {
      const nextPermissionIds = new Set(currentPermissionIds ?? loadedPermissionIds);

      if (checked) {
        nextPermissionIds.add(permissionId);
      } else {
        nextPermissionIds.delete(permissionId);
      }

      return nextPermissionIds;
    });
  }

  async function invalidateRoleQueries(roleId?: number) {
    await queryClient.invalidateQueries({ queryKey: rolesQueryKey });

    if (roleId) {
      await queryClient.invalidateQueries({ queryKey: rolePermissionsQueryKey(roleId) });
    }
  }

  function validateDraft() {
    const errors: string[] = [];

    if (!draftName.trim()) {
      errors.push('Role name is required.');
    }

    if (isCreating && !draftCode.trim()) {
      errors.push('Role code is required.');
    }

    return errors;
  }

  async function handleSave() {
    if (!activeRole) {
      return;
    }

    const validationErrors = validateDraft();

    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const permissionIds = Array.from(effectivePermissionIds);
    const description = draftDescription.trim();
    setFormErrors([]);

    try {
      if (activeRole.kind === 'new') {
        const createdRole = await createRoleMutation.mutateAsync({
          name: draftName.trim(),
          code: draftCode.trim(),
          description: description || undefined,
        });

        try {
          await setRolePermissionsMutation.mutateAsync({
            roleId: createdRole.data.id,
            request: { permissionIds },
          });
        } catch (error) {
          const errors = getApiErrors(error);

          setActiveRole({ kind: 'existing', role: createdRole.data });
          setDraftCode(createdRole.data.code);
          setFormErrors(errors);
          await invalidateRoleQueries(createdRole.data.id);
          toast.error(getApiErrorMessage(error));
          return;
        }

        await invalidateRoleQueries(createdRole.data.id);
        toast.success('Role created.');
        closeDrawer();
        return;
      }

      await updateRoleMutation.mutateAsync({
        roleId: activeRole.role.id,
        request: {
          name: draftName.trim(),
          description: description || null,
        },
      });
      await setRolePermissionsMutation.mutateAsync({
        roleId: activeRole.role.id,
        request: { permissionIds },
      });
      await invalidateRoleQueries(activeRole.role.id);
      toast.success('Role updated.');
      closeDrawer();
    } catch (error) {
      const errors = getApiErrors(error);

      setFormErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleConfirmDelete() {
    if (!rolePendingDelete) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(rolePendingDelete.id);
      await invalidateRoleQueries(rolePendingDelete.id);
      toast.success('Role deleted.');

      if (activeExistingRole?.id === rolePendingDelete.id) {
        closeDrawer();
      }

      setRolePendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {roleSummary.total} Roles · {roleSummary.system} system · {roleSummary.custom} custom
          </p>
          <Button type="button" onClick={openNewRole}>
            <Plus className="size-4" />
            Create Role
          </Button>
        </div>

        {rolesQuery.isError || permissionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Roles & Permissions</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(rolesQuery.error ?? permissionsQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {rolesQuery.isLoading ? (
          <RoleGridSkeleton />
        ) : roles.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>No Roles yet</EmptyTitle>
              <EmptyDescription>
                Create Roles to group Permission Assignments for Staff in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openNewRole}>
                <Plus className="size-4" />
                Create Role
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={openRole}
                onDelete={setRolePendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => (!open ? closeDrawer() : undefined)}>
        <SheetContent
          side="right"
          className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl"
        >
          <SheetHeader className="border-b p-4 pr-12">
            <div className="flex min-w-0 items-start gap-3">
              <RoleIcon isSystem={activeExistingRole?.isSystem ?? false} />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="truncate text-xl">{drawerTitle}</SheetTitle>
                  {activeExistingRole?.isSystem ? (
                    <Badge variant="outline" className="bg-muted/70 uppercase">
                      System
                    </Badge>
                  ) : null}
                </div>
                <SheetDescription>{drawerDescription}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {activeRole ? (
            <>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-6 p-4">
                  {formErrors.length > 0 ? (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Save failed</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc space-y-1 pl-4">
                          {formErrors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <FieldGroup className="gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor="role-name">Role name</FieldLabel>
                        <Input
                          id="role-name"
                          value={draftName}
                          onChange={(event) => {
                            const nextName = event.target.value;
                            setDraftName(nextName);

                            if (isCreating && !codeManuallyEdited) {
                              setDraftCode(buildRoleCode(nextName));
                            }
                          }}
                          disabled={isSaving}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Assigned Staff</FieldLabel>
                        <div className="flex min-h-9 items-center">
                          <Badge variant="outline" className="bg-muted/70 font-mono">
                            {formatCount(
                              activeExistingRole?.assignedStaffCount ?? 0,
                              'staff member'
                            )}
                          </Badge>
                        </div>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="role-code">Role code</FieldLabel>
                      <Input
                        id="role-code"
                        value={draftCode}
                        onChange={(event) => {
                          setCodeManuallyEdited(true);
                          setDraftCode(buildRoleCode(event.target.value));
                        }}
                        disabled={!isCreating || isSaving}
                        className="font-mono"
                      />
                      <p className="text-muted-foreground text-xs">
                        {isCreating
                          ? 'Used as a stable internal code; cannot be changed later.'
                          : 'Role code cannot be changed.'}
                      </p>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="role-description">Description</FieldLabel>
                      <Textarea
                        id="role-description"
                        value={draftDescription}
                        onChange={(event) => setDraftDescription(event.target.value)}
                        disabled={isSaving}
                        rows={3}
                      />
                    </Field>
                  </FieldGroup>

                  <section className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-semibold">Permissions</h2>
                      <p className="text-muted-foreground text-sm">
                        Permission changes are saved only when you choose Save changes.
                      </p>
                    </div>
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
                      <PermissionMatrix
                        sections={permissionSections}
                        grantedPermissionIds={effectivePermissionIds}
                        disabled={
                          isSaving || permissionsQuery.isError || rolePermissionsQuery.isError
                        }
                        onTogglePermission={handleTogglePermission}
                      />
                    )}
                  </section>
                </div>
              </ScrollArea>

              <SheetFooter className="bg-background flex-row justify-end border-t p-4">
                <Button type="button" variant="outline" onClick={closeDrawer} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !draftName.trim() || (isCreating && !draftCode.trim())}
                  aria-busy={isSaving}
                >
                  <Save className="size-4" />
                  Save changes
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={rolePendingDelete !== null}
        onOpenChange={(open) => (!open ? setRolePendingDelete(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {rolePendingDelete ? (
                <>
                  This will delete <strong>{rolePendingDelete.name}</strong>. Roles with active Role
                  Assignments cannot be deleted.
                </>
              ) : (
                'This Role will be deleted.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRoleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteRoleMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
