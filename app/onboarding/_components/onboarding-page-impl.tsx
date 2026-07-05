'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

import { getAuthMutationErrors } from '@/app/queries/auth/auth-api-error';
import { useOnboardTenant } from '@/app/queries/auth/useOnboardTenant';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MultiStepLoader, type LoadingState } from '@/components/ui/multi-step-loader';

const loadingStates: LoadingState[] = [
  { text: 'Creating your workspace' },
  { text: 'Preparing the permission catalogue' },
  { text: 'Setting up appointment masters' },
  { text: 'Registering asset defaults' },
  { text: 'Configuring work order defaults' },
  { text: 'Finishing touches' },
];

export function OnboardingPageImpl({ tenantName }: { tenantName: string }) {
  const router = useRouter();
  const hasStarted = useRef(false);

  const onboardMutation = useOnboardTenant({
    onSuccess: () => {
      router.replace('/dashboard');
      router.refresh();
    },
  });
  const { mutate } = onboardMutation;

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    mutate();
  }, [mutate]);

  const errors = getAuthMutationErrors(onboardMutation.error);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      {/* The loader overlay stays up from first paint until the dashboard
          navigation lands, so the page underneath never flashes between
          mutation states. It only drops on error to reveal the retry UI. */}
      <MultiStepLoader
        loop={false}
        duration={1400}
        loadingStates={loadingStates}
        loading={!onboardMutation.isError}
      />

      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Setting up {tenantName}</h1>
        <p className="text-muted-foreground text-sm">
          We&apos;re preparing your workspace defaults. This only happens once and takes a few
          seconds.
        </p>
      </div>

      {onboardMutation.isError ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not finish setup</AlertTitle>
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

          <Button className="h-10 w-full text-sm" onClick={() => onboardMutation.mutate()}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
