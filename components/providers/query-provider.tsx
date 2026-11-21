'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { describeRequestFailure } from '@/lib/analytics/request-failure';

// Every query and mutation shares this client, so its caches see every failed request. The query
// cache reports a failure once, after the last retry. Auth hooks mark themselves with
// `SKIP_FAILURE_ANALYTICS`, since `sign_in_failed` and `signup_failed` already count them.
function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const failure = describeRequestFailure(error);

        if (failure) {
          captureAnalyticsEvent('data_load_failed', failure);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const failure = describeRequestFailure(error);

        if (failure && mutation.meta?.skipFailureAnalytics !== true) {
          captureAnalyticsEvent('action_rejected', failure);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
