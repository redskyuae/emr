import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { currentUserQueryKey, fetchCurrentUserHomePath } from './useCurrentUser';

function meResponse(roles: { code: string }[], permissions: string[]) {
  return {
    ok: true,
    json: async () => ({ data: { roles, permissions } }),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchCurrentUserHomePath', () => {
  it('should resolve Visits for a Doctor and prime the Current User cache', async () => {
    const queryClient = new QueryClient();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(meResponse([{ code: 'DOCTOR' }], ['visit:read']))
    );

    await expect(fetchCurrentUserHomePath(queryClient)).resolves.toBe('/visits');
    expect(queryClient.getQueryData(currentUserQueryKey)).toEqual({
      data: { roles: [{ code: 'DOCTOR' }], permissions: ['visit:read'] },
    });
  });

  it('should refetch instead of reusing a previous user still in the cache', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
    queryClient.setQueryData(currentUserQueryKey, {
      data: { roles: [{ code: 'DOCTOR' }], permissions: ['visit:read'] },
    });
    const fetchMock = vi.fn().mockResolvedValue(meResponse([], ['dashboard:read']));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCurrentUserHomePath(queryClient)).resolves.toBe('/dashboard');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should fall back to the dashboard when the profile cannot be loaded', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      })
    );

    await expect(fetchCurrentUserHomePath(queryClient)).resolves.toBe('/dashboard');
  });
});
