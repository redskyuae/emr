'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { getAuthMutationErrors } from '@/app/queries/auth/auth-api-error';
import { markTabSession } from '@/app/lib/tab-session';
import { useSignIn } from '@/app/queries/auth/useSignIn';
import { useSignOut } from '@/app/queries/auth/useSignOut';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type LoginFormProps = {
  redirectTo?: string;
  showCreateWorkspaceLink?: boolean;
};

export function LoginForm({
  redirectTo = '/dashboard',
  showCreateWorkspaceLink = false,
}: LoginFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const signOutMutation = useSignOut();

  const signInMutation = useSignIn({
    onSuccess: () => {
      if (!markTabSession()) {
        setStorageError(true);
        signOutMutation.mutate();
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    },
  });

  const errors = [
    ...getAuthMutationErrors(signInMutation.error),
    ...(storageError ? ['Browser tab storage is unavailable. Enable it to sign in.'] : []),
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your hospital group&apos;s workspace.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setStorageError(false);

          const formData = new FormData(event.currentTarget);

          signInMutation.mutate({
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
          });
        }}
      >
        {errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not sign in</AlertTitle>
            <AlertDescription>
              {errors.length === 1 ? (
                errors[0]
              ) : (
                <ul className="list-disc space-y-1 pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@hospital.example"
            autoComplete="email"
            required
            disabled={signInMutation.isPending}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="#"
              className="text-primary text-xs font-medium underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
              disabled={signInMutation.isPending}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={signInMutation.isPending}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-10 w-full text-sm"
          disabled={signInMutation.isPending}
          aria-busy={signInMutation.isPending}
        >
          {signInMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Signing in
            </span>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {showCreateWorkspaceLink ? (
        <p className="text-muted-foreground text-center text-sm">
          New to Medical EMR?{' '}
          <Link
            href="/signup"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Create your Workspace
          </Link>
        </p>
      ) : null}
    </div>
  );
}
