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

type SignupPayload = {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
};

type SignupApiErrorBody = {
  message?: string;
  errors?: string[];
};

class SignupApiError extends Error {
  errors: string[];

  constructor(message: string, errors: string[] = [message]) {
    super(message);
    this.name = 'SignupApiError';
    this.errors = errors;
  }
}

async function parseError(response: Response) {
  let body: SignupApiErrorBody | undefined;

  try {
    body = (await response.json()) as SignupApiErrorBody;
  } catch {
    // Ignore invalid error payloads and fall back to the response status.
  }

  const message = body?.message || 'Signup failed';
  const errors = body?.errors && body.errors.length > 0 ? body.errors : [message];

  return new SignupApiError(message, errors);
}

async function signup(payload: SignupPayload) {
  const response = await fetch('/api/v1/signup', {
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

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      router.replace('/dashboard');
      router.refresh();
    },
  });

  const errors =
    signupMutation.error instanceof SignupApiError
      ? signupMutation.error.errors
      : signupMutation.error
        ? [signupMutation.error.message]
        : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your Workspace</h1>
        <p className="text-muted-foreground text-sm">
          Set up your hospital group&apos;s workspace. You&apos;ll become the Workspace Owner.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);

          signupMutation.mutate({
            tenantName: String(formData.get('tenantName') ?? ''),
            ownerName: String(formData.get('ownerName') ?? ''),
            ownerEmail: String(formData.get('ownerEmail') ?? ''),
            password: String(formData.get('password') ?? ''),
          });
        }}
      >
        {errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not create workspace</AlertTitle>
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
          <Label htmlFor="ownerName">Full name</Label>
          <Input
            id="ownerName"
            name="ownerName"
            placeholder="Dr. Priya Raghavan"
            autoComplete="name"
            required
            disabled={signupMutation.isPending}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Work email</Label>
          <Input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            placeholder="you@northgatehealth.com"
            autoComplete="email"
            required
            disabled={signupMutation.isPending}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantName">Hospital group name</Label>
          <Input
            id="tenantName"
            name="tenantName"
            placeholder="Northgate Health"
            required
            disabled={signupMutation.isPending}
            className="h-10"
          />
          <p className="text-muted-foreground text-xs">
            This becomes your Workspace — you can add hospitals, clinics, and labs as Facilities
            after setup.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={signupMutation.isPending}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={signupMutation.isPending}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="terms" name="terms" required disabled={signupMutation.isPending} />
          <Label htmlFor="terms" className="text-muted-foreground font-normal">
            I agree to the{' '}
            <Link href="#" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          className="h-10 w-full text-[15px]"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Creating workspace
            </span>
          ) : (
            'Create workspace'
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have a workspace?{' '}
        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
