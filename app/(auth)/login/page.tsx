import { redirect } from 'next/navigation';

import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath } from '@/app/lib/auth-route-guards';
import { LoginForm } from '@/components/auth/login-form';

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ next }, session] = await Promise.all([searchParams, getSession()]);
  const redirectTo = getSafeNextPath(next, DEFAULT_AUTH_REDIRECT_PATH);

  if (session) {
    redirect(redirectTo);
  }

  return <LoginForm redirectTo={redirectTo} />;
}
