import { redirect } from 'next/navigation';

import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath } from '@/app/lib/auth-route-guards';
import { SignupForm } from '@/components/auth/signup-form';

type SignupPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [{ next }, session] = await Promise.all([searchParams, getSession()]);

  if (session) {
    redirect(getSafeNextPath(next, DEFAULT_AUTH_REDIRECT_PATH));
  }

  return <SignupForm />;
}
