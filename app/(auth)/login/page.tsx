import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath } from '@/app/lib/auth-route-guards';
import { LoginForm } from '@/app/(auth)/login/_components/login-form';
import { LoginLogo } from '@/app/(auth)/login/_components/login-logo';
import { getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { getAuthLinkFlags } from '@/app/(auth)/_utils/auth-link-flags';

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const redirectTo = getSafeNextPath(next, DEFAULT_AUTH_REDIRECT_PATH);
  const logoVariant = getConfiguredBrandLogoVariant();
  const { showCreateWorkspaceLink } = getAuthLinkFlags();

  return (
    <div className="space-y-8">
      {logoVariant !== 'none' ? <LoginLogo variant={logoVariant} /> : null}
      <LoginForm redirectTo={redirectTo} showCreateWorkspaceLink={showCreateWorkspaceLink} />
    </div>
  );
}
