import {
  KeyRound,
  MoreVertical,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';

import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { formatCount } from '@/lib/format-count';

import { RoleIcon } from './role-icon';
import { RoleGridSkeleton } from '@/app/(protected)/identity-access/roles/_components/role-grid-skeleton';

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

export function RoleGrid({
  roles,
  onEdit,
  onCreate,
  onDelete,
  isLoading,
}: {
  isLoading: boolean;
  onCreate: () => void;
  roles: RoleWithStats[];
  onEdit: (role: RoleWithStats) => void;
  onDelete: (role: RoleWithStats) => void;
}) {
  if (isLoading) {
    return <RoleGridSkeleton />;
  }

  if (roles.length === 0) {
    return (
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
          <Button type="button" onClick={onCreate}>
            <Plus className="size-4" />
            Create Role
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
