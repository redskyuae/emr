'use client';

import { createElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { getAppPageIcon, getAppPageMeta } from '@/components/app/app-shell-config';
import { TenantChip } from '@/components/app/tenant-chip';
import { Button } from '@/components/ui/button';

/**
 * The title of the current page. The title sits on a tinted pill with the icon of its sidebar
 * item, so it reads as the same destination the sidebar highlights, one size up. The page's
 * primary action sits at the end of the row.
 */
export function AppPageHeader() {
  const pathname = usePathname();
  const pageMeta = getAppPageMeta(pathname);
  const { data: hasPrimaryActionPermission } = useHasPermission(
    pageMeta.primaryAction?.permission ?? ''
  );
  const canUsePrimaryAction = !pageMeta.primaryAction?.permission || hasPrimaryActionPermission;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8 lg:pt-6">
      <div className="flex min-w-0 flex-col items-start gap-2.5">
        <div className="bg-primary/10 text-primary flex min-h-12 max-w-full items-center gap-3 rounded-xl py-2 pr-5 pl-4">
          {createElement(getAppPageIcon(pathname), {
            className: 'size-5 shrink-0',
            'aria-hidden': true,
          })}
          <h1 className="min-w-0 text-xl leading-tight font-semibold break-words">
            {pageMeta.title}
          </h1>
        </div>
        <p className="text-muted-foreground max-w-prose text-sm">{pageMeta.subtitle}</p>
        <TenantChip className="md:hidden" />
      </div>

      {pageMeta.primaryAction && canUsePrimaryAction ? (
        <Button asChild size="lg" className="shrink-0 self-start md:mt-1">
          <Link href={pageMeta.primaryAction.href}>
            <Plus />
            <span>{pageMeta.primaryAction.label}</span>
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
