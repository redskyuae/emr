'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { getAuthMutationErrors } from '@/app/queries/auth/auth-api-error';
import { useSignIn } from '@/app/queries/auth/useSignIn';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signInMutation = useSignIn({
    onSuccess: () => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  const errors = getAuthMutationErrors(signInMutation.error);

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

          const formData = new FormData(event.currentTarget);

          signInMutation.mutate({
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
            rememberMe,
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
            placeholder="you@northgatehealth.com"
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            disabled={signInMutation.isPending}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember" className="text-muted-foreground font-normal">
            Keep me signed in on this device
          </Label>
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

      <p className="text-muted-foreground text-center text-sm">
        New to Medical EMR?{' '}
        <Link
          href="/signup"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Create your Workspace
        </Link>
      </p>
    </div>
  );
}
