import { DEFAULT_AUTH_REDIRECT_PATH, getSafeNextPath } from '@/app/lib/auth-route-guards';
import { LoginForm } from '@/app/(auth)/login/_components/login-form';

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const redirectTo = getSafeNextPath(next, DEFAULT_AUTH_REDIRECT_PATH);

  return <LoginForm redirectTo={redirectTo} />;
}
