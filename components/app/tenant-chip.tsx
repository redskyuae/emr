'use client';

import { Building2 } from 'lucide-react';

import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The active Tenant, kept in view on every page so staff never guess where an action lands. A long
 * name wraps inside the chip; it is never truncated.
 */
export function TenantChip({ className }: { className?: string }) {
  const { data: currentUser, isLoading } = useCurrentUserQuery();

  if (isLoading) {
    return (
      <Skeleton className={cn('h-8 w-36 rounded-full', className)} aria-label="Loading Tenant" />
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <span
      className={cn(
        'bg-card text-foreground ring-border inline-flex min-h-8 max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium ring-1',
        className
      )}
    >
      <Building2 className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      <span className="text-muted-foreground shrink-0">Tenant</span>
      <span className="min-w-0 font-semibold break-words">{currentUser.tenant.name}</span>
    </span>
  );
}
