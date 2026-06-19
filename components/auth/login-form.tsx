'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type SigninPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type SigninApiErrorBody = {
  message?: string;
  errors?: string[];
};

class SigninApiError extends Error {
  errors: string[];

  constructor(message: string, errors: string[] = [message]) {
    super(message);
    this.name = 'SigninApiError';
    this.errors = errors;
  }
}

async function parseError(response: Response) {
  let body: SigninApiErrorBody | undefined;

  try {
    body = (await response.json()) as SigninApiErrorBody;
  } catch {
    // Ignore invalid error payloads and fall back to the response status.
  }

  const message = body?.message || 'Sign-in failed';
  const errors = body?.errors && body.errors.length > 0 ? body.errors : [message];

  return new SigninApiError(message, errors);
}

async function signin(payload: SigninPayload) {
  const response = await fetch('/api/v1/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<unknown>;
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const signinMutation = useMutation({
    mutationFn: signin,
    onSuccess: () => {
      router.replace('/dashboard');
      router.refresh();
    },
  });

  const errors =
    signinMutation.error instanceof SigninApiError
      ? signinMutation.error.errors
      : signinMutation.error
        ? [signinMutation.error.message]
        : [];

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

          signinMutation.mutate({
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
            disabled={signinMutation.isPending}
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
              disabled={signinMutation.isPending}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={signinMutation.isPending}
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
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={signinMutation.isPending}
          />
          <Label htmlFor="remember" className="text-muted-foreground font-normal">
            Keep me signed in on this device
          </Label>
        </div>

        <Button
          type="submit"
          className="h-10 w-full text-[15px]"
          disabled={signinMutation.isPending}
        >
          {signinMutation.isPending ? (
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
