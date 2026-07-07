import { beforeEach, describe, expect, it } from 'vitest';

import { seedOrganization } from '@/test/helpers';
import { roleRepository } from './role-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

beforeEach(async () => {
  await seedOrganization(tenantA);
  await seedOrganization(tenantB);
});

const createRole = (tenantId: string, name: string, code: string, description?: string) =>
  roleRepository.createRole(tenantId, {
    name,
    code,
    description,
  });

describe('Role repository', () => {
  it('should create role for a tenant', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC', 'Medical doctor');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Doctor',
      code: 'DOC',
      description: 'Medical doctor',
      isSystem: false,
    });
  });

  it('should get role by id for same tenant', async () => {
    const created = await createRole(tenantA, 'Nurse', 'NUR', 'Nursing staff');
    await expect(roleRepository.getRoleById(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
      name: 'Nurse',
    });
  });

  it('should not get role by id for another tenant', async () => {
    const created = await createRole(tenantA, 'Receptionist', 'REC', 'Front desk');
    await expect(roleRepository.getRoleById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should list only roles for the requested tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await createRole(tenantB, 'Pharmacist', 'PHA');
    const result = await roleRepository.getRoles({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted roles', async () => {
    const deleted = await createRole(tenantA, 'Lab Technician', 'LAB');
    await roleRepository.deleteRole(deleted.id, tenantA);
    await createRole(tenantA, 'Billing Staff', 'BIL');
    const result = await roleRepository.getRoles({ tenantId: tenantA });
    expect(result.data.map((r) => r.code)).toEqual(['BIL']);
  });

  it('should soft-delete role and exclude it from future reads', async () => {
    const created = await createRole(tenantA, 'Admin', 'ADM');
    await expect(roleRepository.deleteRole(created.id, tenantA)).resolves.toMatchObject({
      id: created.id,
    });
    await expect(roleRepository.getRoleById(created.id, tenantA)).resolves.toBeUndefined();
  });

  it('should update only active role for the requested tenant', async () => {
    const created = await createRole(tenantA, 'Manager', 'MGR', 'Department manager');
    await expect(
      roleRepository.updateRole(created.id, tenantA, {
        name: 'Senior Manager',
        description: 'Senior department manager',
      })
    ).resolves.toMatchObject({ name: 'Senior Manager', description: 'Senior department manager' });
    await roleRepository.deleteRole(created.id, tenantA);
    await expect(
      roleRepository.updateRole(created.id, tenantA, {
        name: 'Manager',
        description: 'Department manager',
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's role", async () => {
    const created = await createRole(tenantA, 'Supervisor', 'SUP', 'Team supervisor');
    await expect(
      roleRepository.updateRole(created.id, tenantB, {
        name: 'Senior Supervisor',
        description: 'Senior team supervisor',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(createRole(tenantA, 'doctor', 'DOC2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'role_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(createRole(tenantA, 'Nurse', 'doc')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'role_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(createRole(tenantB, 'Doctor', 'DOC')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC');
    await roleRepository.deleteRole(created.id, tenantA);
    await expect(createRole(tenantA, 'doctor', 'doc')).resolves.toMatchObject({
      name: 'doctor',
      code: 'doc',
    });
  });

  it('should search by name and code', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await createRole(tenantA, 'Nurse', 'NUR');
    expect(
      (await roleRepository.getRoles({ tenantId: tenantA, query: 'doc' })).data.map((r) => r.code)
    ).toEqual(['DOC']);
    expect(
      (await roleRepository.getRoles({ tenantId: tenantA, query: 'NUR' })).data.map((r) => r.name)
    ).toEqual(['Nurse']);
  });

  it('should paginate list results and return total', async () => {
    await createRole(tenantA, 'Alpha', 'A');
    await createRole(tenantA, 'Bravo', 'B');
    await createRole(tenantA, 'Charlie', 'C');
    const result = await roleRepository.getRoles({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((role) => role.name)).toEqual(['Charlie']);
  });

  it('should find active role by name for tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(roleRepository.findActiveByName(tenantA, 'Doctor')).resolves.toMatchObject({
      name: 'Doctor',
      tenantId: tenantA,
    });
  });

  it('should find active role by code for tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(roleRepository.findActiveByCode(tenantA, 'DOC')).resolves.toMatchObject({
      code: 'DOC',
      tenantId: tenantA,
    });
  });

  it('should find active role by name case-insensitively', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(roleRepository.findActiveByName(tenantA, 'doctor')).resolves.toMatchObject({
      name: 'Doctor',
    });
  });

  it('should find active role by code case-insensitively', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(roleRepository.findActiveByCode(tenantA, 'doc')).resolves.toMatchObject({
      code: 'DOC',
    });
  });

  it('should not find soft-deleted role by name', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC');
    await roleRepository.deleteRole(created.id, tenantA);
    await expect(roleRepository.findActiveByName(tenantA, 'Doctor')).resolves.toBeUndefined();
  });

  it('should not find soft-deleted role by code', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC');
    await roleRepository.deleteRole(created.id, tenantA);
    await expect(roleRepository.findActiveByCode(tenantA, 'DOC')).resolves.toBeUndefined();
  });

  it('should find active role by name excluding id', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC');
    await expect(
      roleRepository.findActiveByName(tenantA, 'Doctor', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should find active role by code excluding id', async () => {
    const created = await createRole(tenantA, 'Doctor', 'DOC');
    await expect(
      roleRepository.findActiveByCode(tenantA, 'DOC', { excludeId: created.id })
    ).resolves.toBeUndefined();
  });

  it('should not find role for another tenant', async () => {
    await createRole(tenantA, 'Doctor', 'DOC');
    await expect(roleRepository.findActiveByName(tenantB, 'Doctor')).resolves.toBeUndefined();
    await expect(roleRepository.findActiveByCode(tenantB, 'DOC')).resolves.toBeUndefined();
  });

  it('should get roles by multiple ids for tenant', async () => {
    const role1 = await createRole(tenantA, 'Doctor', 'DOC');
    const role2 = await createRole(tenantA, 'Nurse', 'NUR');
    const role3 = await createRole(tenantB, 'Pharmacist', 'PHA');

    const result = await roleRepository.getRolesByIds([role1.id, role2.id, role3.id], tenantA);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual([role1.id, role2.id]);
    expect(result.every((r) => r.tenantId === tenantA)).toBe(true);
  });

  it('should not return soft-deleted roles when getting by ids', async () => {
    const role1 = await createRole(tenantA, 'Doctor', 'DOC');
    const role2 = await createRole(tenantA, 'Nurse', 'NUR');
    await roleRepository.deleteRole(role1.id, tenantA);

    const result = await roleRepository.getRolesByIds([role1.id, role2.id], tenantA);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(role2.id);
  });

  it('should seed system roles for tenant', async () => {
    const systemRoles = await roleRepository.seedSystemRolesForTenant(tenantA);
    expect(systemRoles).toHaveLength(7);
    expect(systemRoles.every((r) => r.isSystem === true && r.tenantId === tenantA)).toBe(true);
    expect(systemRoles.map((r) => r.code)).toEqual([
      'TENANT_ADMIN',
      'DOCTOR',
      'NURSE',
      'RECEPTIONIST',
      'PHARMACIST',
      'LAB_TECH',
      'BILLING_STAFF',
    ]);
  });

  it('should get an active System Role by reserved code for one tenant', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);

    await expect(roleRepository.getSystemRoleByCode(tenantA, 'DOCTOR')).resolves.toMatchObject({
      code: 'DOCTOR',
      isSystem: true,
      tenantId: tenantA,
    });
    await expect(roleRepository.getSystemRoleByCode(tenantB, 'DOCTOR')).resolves.toBeUndefined();
  });

  it('should not resolve a Tenant-created Role as a System Role', async () => {
    await createRole(tenantA, 'Custom Doctor', 'DOCTOR');

    await expect(roleRepository.getSystemRoleByCode(tenantA, 'DOCTOR')).resolves.toBeUndefined();
  });

  it('should fail System Role seeding when a Tenant-created Role uses a reserved code', async () => {
    await createRole(tenantA, 'Custom Doctor', 'DOCTOR');

    await expect(roleRepository.seedSystemRolesForTenant(tenantA)).rejects.toThrow(
      'System Role seeding failed because a reserved Role code is unavailable.'
    );
  });

  it('should not duplicate system roles on repeated seed', async () => {
    await roleRepository.seedSystemRolesForTenant(tenantA);
    await roleRepository.seedSystemRolesForTenant(tenantA);

    const result = await roleRepository.getRoles({ tenantId: tenantA });
    const systemRoleCodes = result.data.filter((r) => r.isSystem).map((r) => r.code);
    expect(systemRoleCodes).toEqual([
      'BILLING_STAFF',
      'DOCTOR',
      'LAB_TECH',
      'NURSE',
      'PHARMACIST',
      'RECEPTIONIST',
      'TENANT_ADMIN',
    ]);
  });
});
