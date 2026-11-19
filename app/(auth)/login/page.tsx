import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath } from '@/app/lib/auth-route-guards';
import { getIdleSignOutMessage, parseIdleTimeoutMinutes } from '@/app/lib/idle-session';
import { LoginForm } from '@/app/(auth)/login/_components/login-form';
import { LoginLogo } from '@/app/(auth)/login/_components/login-logo';
import { getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { getAuthLinkFlags } from '@/app/(auth)/_utils/auth-link-flags';

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, reason } = await searchParams;
  const redirectTo = getSafeNextPath(next, DEFAULT_AUTH_REDIRECT_PATH);
  const logoVariant = getConfiguredBrandLogoVariant();
  const { showCreateWorkspaceLink } = getAuthLinkFlags();
  const notice =
    reason === 'idle'
      ? getIdleSignOutMessage(parseIdleTimeoutMinutes(process.env.IDLE_TIMEOUT_MINUTES))
      : undefined;

  return (
    <div className="space-y-8">
      {logoVariant !== 'none' ? <LoginLogo variant={logoVariant} /> : null}
      <LoginForm
        notice={notice}
        redirectTo={redirectTo}
        showCreateWorkspaceLink={showCreateWorkspaceLink}
      />
    </div>
  );
}
