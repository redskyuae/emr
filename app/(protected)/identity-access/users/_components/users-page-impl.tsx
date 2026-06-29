'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { toast } from 'sonner';

import type { StaffWithRoles } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useReactivateStaff } from '@/app/queries/identity-access/useReactivateStaff';
import { useRolesQuery } from '@/app/queries/identity-access/useRoles';
import { useStaffQuery } from '@/app/queries/identity-access/useStaff';

import { DeactivateUserDialog } from './_modals/deactivate-user-dialog';
import { UserFormSheet } from './_sheets/user-form-sheet';
import { UsersTable } from './users-table';
import { UsersToolbar } from './users-toolbar';

const PAGE_SIZE = 10;

export function UsersPageImpl() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [roleParam, setRoleParam] = useQueryState('role', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('status', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [userParam, setUserParam] = useQueryState('user');

  const [staffPendingDeactivate, setStaffPendingDeactivate] = useState<StaffWithRoles | null>(null);

  const rolesQuery = useRolesQuery();
  const roles = rolesQuery.data ?? [];

  // Guard against invalid URL values (?page=0, ?page=-1) reaching the query.
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const roleId = roleParam ? Number(roleParam) : Number.NaN;
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;

  const staffQuery = useStaffQuery({
    page,
    limit: PAGE_SIZE,
    query: search.trim() ? search.trim() : undefined,
    roleId: Number.isInteger(roleId) && roleId > 0 ? roleId : undefined,
    status,
  });
  const reactivateMutation = useReactivateStaff();

  const staff = staffQuery.data?.data ?? [];
  const meta = staffQuery.data?.meta;

  // Re-sync the URL when the requested page is invalid or now out of range (e.g. a
  // deactivate/reactivate shrank the filtered set past the current page), so the
  // table doesn't get stuck on an empty page with pagination hidden.
  useEffect(() => {
    if (pageParam !== page) {
      void setPage(page);
      return;
    }

    if (meta?.totalPages && page > meta.totalPages) {
      void setPage(meta.totalPages);
    }
  }, [meta?.totalPages, page, pageParam, setPage]);

  const isCreating = userParam === 'new';
  const editingUserId = userParam && userParam !== 'new' ? userParam : null;
  const sheetOpen = isCreating || editingUserId !== null;

  function goToFirstPage() {
    void setPage(1);
  }

  function handleReactivate(member: StaffWithRoles) {
    reactivateMutation.mutate(member.id, {
      onSuccess: () => toast.success(`${member.name} reactivated.`),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  return (
    <>
      <div className="space-y-4">
        <UsersToolbar
          search={search}
          onSearchChange={(value) => {
            void setSearch(value || null);
            goToFirstPage();
          }}
          roleValue={roleParam}
          onRoleChange={(value) => {
            void setRoleParam(value || null);
            goToFirstPage();
          }}
          statusValue={statusParam}
          onStatusChange={(value) => {
            void setStatusParam(value || null);
            goToFirstPage();
          }}
          roles={roles}
          rolesLoading={rolesQuery.isLoading}
          onAddUser={() => void setUserParam('new')}
        />

        <UsersTable
          staff={staff}
          meta={meta}
          isLoading={staffQuery.isLoading}
          isFetching={staffQuery.isFetching}
          isError={staffQuery.isError}
          error={staffQuery.error}
          page={page}
          onPageChange={(next) => void setPage(next)}
          onEdit={(member) => void setUserParam(member.id)}
          onDeactivate={setStaffPendingDeactivate}
          onReactivate={handleReactivate}
          reactivatingId={
            reactivateMutation.isPending ? (reactivateMutation.variables ?? null) : null
          }
        />
      </div>

      <UserFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        userId={editingUserId}
        roles={roles}
        rolesLoading={rolesQuery.isLoading}
        onClose={() => void setUserParam(null)}
      />

      <DeactivateUserDialog
        staff={staffPendingDeactivate}
        onClose={() => setStaffPendingDeactivate(null)}
        onDeactivated={(userId) => {
          if (editingUserId === userId) {
            void setUserParam(null);
          }
        }}
      />
    </>
  );
}
