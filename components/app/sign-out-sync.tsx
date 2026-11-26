'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { clearTabSession } from '@/app/lib/tab-session';
import { getSignedOutPath, readSignOutBroadcast } from '@/app/lib/idle-session';

// Follows a sign-out from another tab, whether manual or idle, so this tab stops showing
// protected pages and cached Patient data. Mounted whether or not idle timeout is enabled.
export function SignOutSync() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      const reason = readSignOutBroadcast(event.key, event.newValue);
      if (!reason) return;

      // Another tab already ended the shared Session on the server.
      clearTabSession();
      queryClient.clear();
      router.replace(getSignedOutPath(reason));
      router.refresh();
    }

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, [queryClient, router]);

  return null;
}
