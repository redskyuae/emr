'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    setHasError(false);

    try {
      const response = await fetch('/api/v1/signout', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setHasError(true);
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={hasError ? 'destructive' : 'ghost'}
      size="icon-sm"
      className="group-data-[collapsible=icon]:hidden"
      aria-label={hasError ? 'Sign out failed. Try again.' : 'Sign out'}
      title={hasError ? 'Sign out failed. Try again.' : 'Sign out'}
      disabled={isPending}
      onClick={handleSignOut}
    >
      {isPending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
    </Button>
  );
}
