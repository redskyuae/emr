import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authRepository } from '../repository/auth-repository';
import { getSignInAuditActorQuery } from './get-sign-in-audit-actor-query';

vi.mock('../repository/auth-repository', () => ({
  authRepository: { findUserByEmail: vi.fn(), listActiveTenantsForUser: vi.fn() },
}));

const repo = vi.mocked(authRepository);
const sara = { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' };

describe('getSignInAuditActorQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findUserByEmail.mockResolvedValue(sara);
    repo.listActiveTenantsForUser.mockResolvedValue([{ id: 'tenant-1' }] as never);
  });

  it('should not look anyone up for a malformed email', async () => {
    await expect(getSignInAuditActorQuery('not-an-email')).resolves.toBeNull();
    await expect(getSignInAuditActorQuery(undefined)).resolves.toBeNull();
    expect(repo.findUserByEmail).not.toHaveBeenCalled();
  });

  it('should find the user by a normalised email, with their active Tenants', async () => {
    await expect(getSignInAuditActorQuery('  Sara.Ali@Hospital.example ')).resolves.toEqual({
      user: sara,
      tenantIds: ['tenant-1'],
    });
    expect(repo.findUserByEmail).toHaveBeenCalledWith('sara.ali@hospital.example');
  });

  it('should return null for an unknown email or a user with no active Tenant', async () => {
    repo.findUserByEmail.mockResolvedValue(undefined);
    await expect(getSignInAuditActorQuery('nobody@hospital.example')).resolves.toBeNull();

    repo.findUserByEmail.mockResolvedValue(sara);
    repo.listActiveTenantsForUser.mockResolvedValue([]);
    await expect(getSignInAuditActorQuery('sara.ali@hospital.example')).resolves.toBeNull();
  });
});
