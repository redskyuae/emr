'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { useSignOut } from '@/app/queries/auth/useSignOut';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function SignOutButton() {
  const router = useRouter();
  const signOutMutation = useSignOut(() => {
    router.replace('/login');
    router.refresh();
  });

  function handleSignOut() {
    signOutMutation.mutate();
  }

  return (
    <Button
      type="button"
      variant={signOutMutation.isError ? 'destructive' : 'ghost'}
      size="icon-sm"
      className="group-data-[collapsible=icon]:hidden"
      aria-label={signOutMutation.isError ? 'Sign out failed. Try again.' : 'Sign out'}
      title={signOutMutation.isError ? 'Sign out failed. Try again.' : 'Sign out'}
      disabled={signOutMutation.isPending}
      onClick={handleSignOut}
    >
      {signOutMutation.isPending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
    </Button>
  );
}
