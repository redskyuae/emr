'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Crown,
  HeartPulse,
  KeyRound,
  LockKeyhole,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  Save,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import {
  iamPermissionId,
  type IamDirectoryUser,
  type IamPermissionSection,
  type IamRole,
  type IamRoleIcon,
} from '@/app/(app)/iam-dashboard/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const newRoleId = 'new-role';

const iconByRoleIcon: Record<IamRoleIcon, LucideIcon> = {
  crown: Crown,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  heart: HeartPulse,
  receipt: Receipt,
  clipboard: ClipboardList,
};

const roleIconClassByTone: Record<IamRole['tone'], string> = {
  primary: 'border-primary/20 bg-primary/10 text-primary',
  chart2: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
  chart4: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  chart5: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
  destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
};

function buildNewRole(): IamRole {
  return {
    id: newRoleId,
    name: 'New Role',
    kind: 'Custom',
    description: '',
    userCount: 0,
    assignedUserIds: [],
    icon: 'shield',
    tone: 'primary',
    grantedPermissionIds: [],
  };
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function countGrantedInSection(section: IamPermissionSection, grantedPermissionIds: Set<string>) {
  return section.resources.reduce(
    (sectionTotal, resource) =>
      sectionTotal +
      resource.actions.filter((action) =>
        grantedPermissionIds.has(iamPermissionId(section.id, resource.id, action.id))
      ).length,
    0
  );
}

function countGrantedPermissions(role: Pick<IamRole, 'grantedPermissionIds'>) {
  return role.grantedPermissionIds.length;
}

function RoleIcon({
  icon,
  tone,
  className,
}: {
  icon: IamRoleIcon;
  tone: IamRole['tone'];
  className?: string;
}) {
  const Icon = iconByRoleIcon[icon];

  return (
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-lg border',
        roleIconClassByTone[tone],
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

function AssignedUsers({
  role,
  staffById,
}: {
  role: IamRole;
  staffById: Map<string, IamDirectoryUser>;
}) {
  const assignedUsers = role.assignedUserIds
    .map((staffId) => staffById.get(staffId))
    .filter((staffUser): staffUser is IamDirectoryUser => Boolean(staffUser));
  const visibleUsers = assignedUsers.slice(0, 3);
  const hiddenUserCount = Math.max(role.userCount - visibleUsers.length, 0);

  if (!visibleUsers.length && !hiddenUserCount) {
    return <p className="text-muted-foreground text-sm">No Staff assigned</p>;
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-2">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="border-background size-9 border-2">
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{user.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {hiddenUserCount ? (
        <Badge variant="outline" className="bg-muted/70 font-mono">
          +{hiddenUserCount} more
        </Badge>
      ) : null}
    </div>
  );
}

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: IamRole;
  onEdit: (role: IamRole) => void;
  onDelete: (roleId: string) => void;
}) {
  return (
    <Card className="shadow-fluent-2 hover:shadow-fluent-8 transition-shadow">
      <CardContent className="flex min-h-52 flex-col gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <RoleIcon icon={role.icon} tone={role.tone} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold">{role.name}</h2>
              {role.kind === 'System' ? (
                <Badge variant="outline" className="bg-muted/70 text-[11px] uppercase">
                  System
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">{role.description}</p>
          </div>
        </div>

        <Separator />

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <UsersRound className="size-4" />
            {pluralize(role.userCount, 'user')}
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <KeyRound className="size-4" />
            {pluralize(countGrantedPermissions(role), 'permission')}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(role)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            {role.kind === 'Custom' ? (
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
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(role.id)}>
                    <Trash2 className="size-4" />
                    Remove Role
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

function PermissionMatrix({
  sections,
  grantedPermissionIds,
  readOnly,
  onTogglePermission,
}: {
  sections: IamPermissionSection[];
  grantedPermissionIds: Set<string>;
  readOnly: boolean;
  onTogglePermission: (permissionId: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-7">
      {sections.map((section) => {
        const grantedCount = countGrantedInSection(section, grantedPermissionIds);

        return (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b pb-2">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.name}
              </h3>
              <span className="text-muted-foreground font-mono text-xs font-semibold uppercase">
                {grantedCount} granted
              </span>
            </div>

            <div className="divide-y rounded-md border">
              {section.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="grid gap-3 p-3 md:grid-cols-[150px_minmax(0,1fr)] md:items-start"
                >
                  <p className="font-medium">{resource.name}</p>
                  <div className="grid [grid-template-columns:repeat(auto-fit,minmax(8.75rem,1fr))] gap-x-4 gap-y-3">
                    {resource.actions.map((action) => {
                      const permissionId = iamPermissionId(section.id, resource.id, action.id);
                      const checkboxId = `permission-${permissionId}`;

                      return (
                        <label
                          key={permissionId}
                          htmlFor={checkboxId}
                          className={cn(
                            'flex min-h-7 items-center gap-2 text-sm',
                            readOnly ? 'text-muted-foreground' : 'cursor-pointer'
                          )}
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={grantedPermissionIds.has(permissionId)}
                            disabled={readOnly}
                            onCheckedChange={(checked) =>
                              onTogglePermission(permissionId, checked === true)
                            }
                            aria-label={`${resource.name}: ${action.label}`}
                          />
                          <span>{action.label}</span>
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

export function RolesPageClient({
  roles,
  permissionSections,
  staffUsers,
  initialCreateOpen,
}: {
  roles: IamRole[];
  permissionSections: IamPermissionSection[];
  staffUsers: IamDirectoryUser[];
  initialCreateOpen: boolean;
}) {
  const router = useRouter();
  const [localRoles, setLocalRoles] = useState<IamRole[]>(roles);
  const [activeRole, setActiveRole] = useState<IamRole | null>(() =>
    initialCreateOpen ? buildNewRole() : null
  );
  const [draftName, setDraftName] = useState(activeRole?.name ?? '');
  const [draftDescription, setDraftDescription] = useState(activeRole?.description ?? '');
  const [draftPermissionIds, setDraftPermissionIds] = useState<Set<string>>(
    () => new Set(activeRole?.grantedPermissionIds ?? [])
  );

  const staffById = useMemo(
    () => new Map(staffUsers.map((staffUser) => [staffUser.id, staffUser])),
    [staffUsers]
  );

  const roleSummary = useMemo(() => {
    const systemCount = localRoles.filter((role) => role.kind === 'System').length;
    const customCount = localRoles.length - systemCount;

    return {
      total: localRoles.length,
      system: systemCount,
      custom: customCount,
    };
  }, [localRoles]);

  const readOnly = activeRole?.kind === 'System';
  const drawerOpen = Boolean(activeRole);
  const drawerTitle = activeRole?.id === newRoleId ? 'New Role' : (activeRole?.name ?? 'Role');
  const drawerDescription =
    activeRole?.kind === 'System'
      ? 'System Role · managed by system'
      : 'Custom Role · edit permissions below';

  function openRole(role: IamRole) {
    setActiveRole(role);
    setDraftName(role.name);
    setDraftDescription(role.description);
    setDraftPermissionIds(new Set(role.grantedPermissionIds));
  }

  function openNewRole() {
    openRole(buildNewRole());
  }

  function closeDrawer() {
    setActiveRole(null);
    router.replace('/roles', { scroll: false });
  }

  function handleTogglePermission(permissionId: string, checked: boolean) {
    setDraftPermissionIds((currentPermissionIds) => {
      const nextPermissionIds = new Set(currentPermissionIds);

      if (checked) {
        nextPermissionIds.add(permissionId);
      } else {
        nextPermissionIds.delete(permissionId);
      }

      return nextPermissionIds;
    });
  }

  function handleSave() {
    if (!activeRole || activeRole.kind === 'System' || !draftName.trim()) {
      return;
    }

    const nextRole: IamRole = {
      ...activeRole,
      name: draftName.trim(),
      description: draftDescription.trim(),
      grantedPermissionIds: Array.from(draftPermissionIds),
    };

    setLocalRoles((currentRoles) => {
      if (nextRole.id === newRoleId) {
        return [
          ...currentRoles,
          {
            ...nextRole,
            id: `role-${nextRole.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'custom'}`,
          },
        ];
      }

      return currentRoles.map((role) => (role.id === nextRole.id ? nextRole : role));
    });

    closeDrawer();
  }

  function handleDelete(roleId: string) {
    setLocalRoles((currentRoles) =>
      currentRoles.filter((role) => role.id !== roleId || role.kind === 'System')
    );
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {localRoles.map((role) => (
            <RoleCard key={role.id} role={role} onEdit={openRole} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={(open) => (!open ? closeDrawer() : undefined)}>
        <SheetContent
          side="right"
          className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-[760px]"
          style={{ width: 'min(760px, 100vw)', maxWidth: '100vw' }}
        >
          <SheetHeader className="border-b p-4 pr-12">
            <div className="flex min-w-0 items-start gap-3">
              {activeRole ? <RoleIcon icon={activeRole.icon} tone={activeRole.tone} /> : null}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="truncate text-xl">{drawerTitle}</SheetTitle>
                  {activeRole?.kind === 'System' ? (
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
                  {readOnly ? (
                    <div className="bg-muted/60 text-muted-foreground flex gap-3 rounded-md border p-3 text-sm">
                      <LockKeyhole className="text-primary mt-0.5 size-4 shrink-0" />
                      <p>
                        Managed by system. Role fields and Permission Assignments are read-only for
                        baseline System Roles.
                      </p>
                    </div>
                  ) : null}

                  <FieldGroup className="gap-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                      <Field>
                        <FieldLabel htmlFor="role-name">Role name</FieldLabel>
                        <Input
                          id="role-name"
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          disabled={readOnly}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Assigned users</FieldLabel>
                        <AssignedUsers role={activeRole} staffById={staffById} />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="role-description">Description</FieldLabel>
                      <Textarea
                        id="role-description"
                        value={draftDescription}
                        onChange={(event) => setDraftDescription(event.target.value)}
                        disabled={readOnly}
                        rows={3}
                      />
                    </Field>
                  </FieldGroup>

                  <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Permissions</h2>
                    <PermissionMatrix
                      sections={permissionSections}
                      grantedPermissionIds={draftPermissionIds}
                      readOnly={readOnly}
                      onTogglePermission={handleTogglePermission}
                    />
                  </section>
                </div>
              </ScrollArea>

              <SheetFooter className="bg-background flex-row justify-end border-t p-4">
                {readOnly ? (
                  <SheetClose asChild>
                    <Button type="button" onClick={closeDrawer}>
                      Close
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button type="button" variant="outline" onClick={closeDrawer}>
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button type="button" onClick={handleSave} disabled={!draftName.trim()}>
                      <Save className="size-4" />
                      Save changes
                    </Button>
                  </>
                )}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
