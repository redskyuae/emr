import { describe, expect, it } from 'vitest';

import { ApiError } from '@/app/queries/api-error';
import { describeRequestFailure } from './request-failure';

const rejected = (status: number | undefined, url = 'https://emr.example/api/v1/roles') =>
  new ApiError('Role name Admin already exists.', undefined, status, url);

describe('describeRequestFailure', () => {
  it('should record a conflict with the cleaned route and status, never the message', () => {
    const failure = describeRequestFailure(
      rejected(409, 'https://emr.example/api/v1/appointments/123/reschedule?slot=2026-11-21')
    );

    expect(failure).toEqual({
      api_route: '/api/v1/appointments/:id/reschedule',
      status: 409,
      rejection_kind: 'conflict',
    });
    expect(JSON.stringify(failure)).not.toContain('Admin');
  });

  it.each([
    [400, 'validation'],
    [422, 'validation'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [500, 'server_error'],
    [503, 'server_error'],
    [405, 'other'],
    [429, 'other'],
  ] as const)('should classify status %s as %s', (status, kind) => {
    expect(describeRequestFailure(rejected(status))?.rejection_kind).toBe(kind);
  });

  it('should skip a 401, which means the Session expired', () => {
    expect(describeRequestFailure(rejected(401))).toBeNull();
  });

  it('should replace every id segment, including random string ids', () => {
    expect(
      describeRequestFailure(rejected(404, 'https://emr.example/api/v1/users/aB3xY9qLmN/roles/4'))
        ?.api_route
    ).toBe('/api/v1/users/:id/roles/:id');
    expect(
      describeRequestFailure(
        rejected(404, '/api/v1/patients/42/treatment-plans/3f2504e0-4f89-11d3-9a0c-0305e82c3301')
      )?.api_route
    ).toBe('/api/v1/patients/:id/treatment-plans/:id');
  });

  it('should leave out an address that is missing or not an API route', () => {
    expect(describeRequestFailure(rejected(500, ''))).toEqual({
      status: 500,
      rejection_kind: 'server_error',
    });
    expect(
      describeRequestFailure(rejected(500, 'https://blob.example/uploads/scan.pdf'))?.api_route
    ).toBeUndefined();
  });

  it('should record an API error without a status as other', () => {
    expect(describeRequestFailure(rejected(undefined))).toEqual({
      api_route: '/api/v1/roles',
      rejection_kind: 'other',
    });
  });

  it('should record a failed fetch or a timeout as a network failure', () => {
    expect(describeRequestFailure(new TypeError('Failed to fetch'))).toEqual({
      rejection_kind: 'network',
    });
    expect(describeRequestFailure(new DOMException('timed out', 'TimeoutError'))).toEqual({
      rejection_kind: 'network',
    });
  });

  it('should skip a cancelled request and errors that are not API rejections', () => {
    expect(describeRequestFailure(new DOMException('aborted', 'AbortError'))).toBeNull();
    expect(describeRequestFailure(new Error('Sign out failed'))).toBeNull();
    expect(describeRequestFailure('nope')).toBeNull();
  });
});
