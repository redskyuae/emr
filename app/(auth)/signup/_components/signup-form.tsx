'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

import { getAuthMutationErrors } from '@/app/queries/auth/auth-api-error';
import { useSignUp } from '@/app/queries/auth/useSignUp';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const signUpMutation = useSignUp({
    onSuccess: () => {
      router.replace('/onboarding');
      router.refresh();
    },
  });

  const errors = getAuthMutationErrors(signUpMutation.error);

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

          signUpMutation.mutate({
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
            disabled={signUpMutation.isPending}
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
            disabled={signUpMutation.isPending}
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
            disabled={signUpMutation.isPending}
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
              disabled={signUpMutation.isPending}
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={signUpMutation.isPending}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="terms" name="terms" required disabled={signUpMutation.isPending} />
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
          className="h-10 w-full text-sm"
          disabled={signUpMutation.isPending}
          aria-busy={signUpMutation.isPending}
        >
          {signUpMutation.isPending ? (
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
