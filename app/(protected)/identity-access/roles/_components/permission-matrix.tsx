import { KeyRound } from 'lucide-react';

import type { PermissionListItem } from '@/app/api/lib/modules/permission/schemas/permission-schema';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

import {
  actionLabel,
  countGrantedInSection,
  countSectionPermissions,
} from '../_utils/permission-sections';

type PermissionResource = {
  id: string;
  label: string;
  permissions: PermissionListItem[];
};

export type PermissionSection = {
  id: string;
  label: string;
  resources: PermissionResource[];
};

export function PermissionMatrix({
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
