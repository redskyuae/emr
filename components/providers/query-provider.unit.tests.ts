// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/app/queries/api-error';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { SKIP_FAILURE_ANALYTICS } from '@/lib/analytics/request-failure';
import { QueryProvider } from './query-provider';

vi.mock('@/lib/analytics/analytics-client', () => ({ captureAnalyticsEvent: vi.fn() }));
vi.mock('nuqs/adapters/next/app', () => ({
  NuqsAdapter: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

const rejection = (status: number, url: string) =>
  new ApiError('Role name Admin already exists.', undefined, status, url);

function FailingList({ error }: { error: unknown }) {
  const query = useQuery({
    queryKey: ['roles'],
    queryFn: () => Promise.reject(error),
    retry: 2,
    retryDelay: 0,
  });

  return createElement('p', null, query.isError ? 'failed' : 'loading');
}

function FailingSave({ error, meta }: { error: unknown; meta?: Record<string, unknown> }) {
  const mutation = useMutation({ mutationFn: () => Promise.reject(error), meta });

  return createElement(
    'button',
    { type: 'button', onClick: () => mutation.mutate() },
    mutation.isError ? 'failed' : 'save'
  );
}

function renderInProvider(child: ReactNode) {
  return render(createElement(QueryProvider, null, child));
}

describe('QueryProvider failure analytics', () => {
  beforeEach(() => {
    vi.mocked(captureAnalyticsEvent).mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should record data_load_failed once, after the retries', async () => {
    renderInProvider(
      createElement(FailingList, {
        error: rejection(500, 'https://emr.example/api/v1/roles?page=2'),
      })
    );

    await screen.findByText('failed');

    expect(captureAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(captureAnalyticsEvent).toHaveBeenCalledWith('data_load_failed', {
      api_route: '/api/v1/roles',
      status: 500,
      rejection_kind: 'server_error',
    });
  });

  it('should record a rejected save as action_rejected without the message or record id', async () => {
    renderInProvider(
      createElement(FailingSave, {
        error: rejection(409, 'https://emr.example/api/v1/roles/42'),
      })
    );

    screen.getByRole('button').click();
    await screen.findByText('failed');

    expect(captureAnalyticsEvent).toHaveBeenCalledWith('action_rejected', {
      api_route: '/api/v1/roles/:id',
      status: 409,
      rejection_kind: 'conflict',
    });
  });

  it('should not record an expired Session or a hook that counts its own failures', async () => {
    renderInProvider(
      createElement(
        Fragment,
        null,
        createElement(FailingSave, { error: rejection(401, '/api/v1/roles') }),
        createElement(FailingSave, {
          error: new TypeError('Failed to fetch'),
          meta: SKIP_FAILURE_ANALYTICS,
        })
      )
    );

    screen.getAllByRole('button').forEach((button) => button.click());

    await waitFor(() => expect(screen.getAllByText('failed')).toHaveLength(2));
    expect(captureAnalyticsEvent).not.toHaveBeenCalled();
  });
});
