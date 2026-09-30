import { Skeleton } from '@/components/ui/skeleton';
import { getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { getAuthLinkFlags } from '@/app/(auth)/_utils/auth-link-flags';

export default function LoginLoader() {
  const logoVariant = getConfiguredBrandLogoVariant();
  const { showCreateWorkspaceLink } = getAuthLinkFlags();

  return (
    <div className="space-y-8" aria-label="Loading hospital sign-in form">
      {logoVariant !== 'none' ? (
        <Skeleton
          className={
            logoVariant === 'dhathri-gram' ? 'mx-auto h-40 w-44' : 'mx-auto h-36 w-full max-w-sm'
          }
        />
      ) : null}

      <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="h-10 w-full" />
        </div>

        {showCreateWorkspaceLink ? <Skeleton className="mx-auto h-4 w-56 max-w-full" /> : null}
      </div>
    </div>
  );
}
