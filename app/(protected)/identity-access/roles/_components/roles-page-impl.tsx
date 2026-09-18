'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle, Plus } from 'lucide-react';

import type { RoleWithStats } from '@/app/api/lib/modules/role/schemas/role-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
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

  const { data: canCreate, isLoading: canCreateLoading } = useHasPermission('role:create');
  const { data: canUpdate, isLoading: canUpdateLoading } = useHasPermission('role:update');
  const { data: canDelete } = useHasPermission('role:delete');

  const roles = rolesQuery.data ?? [];
  const roleSummary: RoleSummary = rolesSummaryQuery.data ?? { total: 0, system: 0, custom: 0 };

  const isCreating = roleParam === 'new' && canCreate;
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
    isCreating ||
    (canUpdate && editingRoleId !== null && (rolesQuery.isLoading || editingRole !== null));
  const roleResolving = sheetOpen && !isCreating && editingRole === null;

  const roleAccessDenied =
    (roleParam === 'new' && !canCreateLoading && !canCreate) ||
    (editingRoleId !== null && !canUpdateLoading && !canUpdate);

  useEffect(() => {
    if (roleAccessDenied) {
      void setRoleParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleAccessDenied]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {roleSummary.total} Roles · {roleSummary.system} system · {roleSummary.custom} custom
          </p>
          {canCreate ? (
            <Button type="button" onClick={() => void setRoleParam('new')}>
              <Plus className="size-4" />
              Create Role
            </Button>
          ) : null}
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
          canCreate={canCreate}
          canEdit={canUpdate}
          canDelete={canDelete}
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
        role={canDelete ? rolePendingDelete : null}
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
