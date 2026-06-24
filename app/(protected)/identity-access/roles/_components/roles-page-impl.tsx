'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle, Plus } from 'lucide-react';

import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  useRolesQuery,
  useRolesSummaryQuery,
  type RoleSummary,
} from '@/app/queries/identity-access/useRoles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { DeleteRoleDialog } from './_modals/delete-role-dialog';
import { RoleFormSheet } from './_sheets/role-form-sheet';
import { RoleGrid } from './role-grid';

export function RolesPageImpl() {
  const [roleParam, setRoleParam] = useQueryState('role');
  const rolesQuery = useRolesQuery();
  const rolesSummaryQuery = useRolesSummaryQuery();
  const [rolePendingDelete, setRolePendingDelete] = useState<RoleWithStats | null>(null);

  const roles = rolesQuery.data ?? [];
  const roleSummary: RoleSummary = rolesSummaryQuery.data ?? { total: 0, system: 0, custom: 0 };

  const isCreating = roleParam === 'new';
  const editingRoleId =
    roleParam !== null && roleParam !== 'new' && /^\d+$/.test(roleParam) ? Number(roleParam) : null;
  const editingRole =
    editingRoleId !== null ? (roles.find((role) => role.id === editingRoleId) ?? null) : null;

  // The sheet opens straight from the URL, with no effect syncing state back to it.
  // - ?role=new                 -> create
  // - ?role=<id> still loading  -> open, resolving (skeleton)
  // - ?role=<id> found          -> edit
  // - ?role=<id> not found, or garbage -> stays closed (the stale param is
  //   harmless and gets overwritten by the next action)
  const sheetOpen =
    isCreating || (editingRoleId !== null && (rolesQuery.isLoading || editingRole !== null));
  const roleResolving = sheetOpen && !isCreating && editingRole === null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {roleSummary.total} Roles · {roleSummary.system} system · {roleSummary.custom} custom
          </p>
          <Button type="button" onClick={() => void setRoleParam('new')}>
            <Plus className="size-4" />
            Create Role
          </Button>
        </div>

        {rolesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Roles</AlertTitle>
            <AlertDescription>{getApiErrorMessage(rolesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <RoleGrid
          roles={roles}
          onDelete={setRolePendingDelete}
          isLoading={rolesQuery.isLoading}
          onCreate={() => void setRoleParam('new')}
          onEdit={(role) => void setRoleParam(String(role.id))}
        />
      </div>

      <RoleFormSheet
        open={sheetOpen}
        role={editingRole}
        roleId={editingRoleId}
        roleResolving={roleResolving}
        mode={isCreating ? 'new' : 'edit'}
        onClose={() => void setRoleParam(null)}
        onSwitchToEdit={(roleId) => void setRoleParam(String(roleId))}
      />

      <DeleteRoleDialog
        role={rolePendingDelete}
        onClose={() => setRolePendingDelete(null)}
        onDeleted={(roleId) => {
          if (editingRoleId === roleId) {
            void setRoleParam(null);
          }
        }}
      />
    </>
  );
}
