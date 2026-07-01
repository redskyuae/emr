import { generateId } from '@better-auth/core/utils/id';
import { beforeEach, describe, expect, it } from 'vitest';

import { seedOrganization } from '@/test/helpers';
import { staffRepository } from './staff-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

beforeEach(async () => {
  await seedOrganization(tenantA);
  await seedOrganization(tenantB);
});

const createTestUser = async (email: string, name: string) => {
  const { db } = await import('@/app/db');
  const { user: userTable } = await import('@/app/db/schema/auth');

  const userId = generateId();
  await db.insert(userTable).values({
    id: userId,
    email,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return userId;
};

const createTestRole = async (tenantId: string, name: string, code: string) => {
  const { db } = await import('@/app/db');
  const { role: roleTable } = await import('@/app/db/schema/role');

  const [role] = await db
    .insert(roleTable)
    .values({
      tenantId,
      name,
      code,
      description: `${name} role`,
    })
    .returning();

  return role;
};

describe('Staff repository', () => {
  it('should find user by email case-insensitively', async () => {
    const userId = await createTestUser('test@example.com', 'Test User');
    const found = await staffRepository.findUserByEmail('TEST@EXAMPLE.COM');
    expect(found).toMatchObject({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should return undefined for non-existent user email', async () => {
    const found = await staffRepository.findUserByEmail('nonexistent@example.com');
    expect(found).toBeUndefined();
  });

  it('should find non-deleted staff by staff code case-insensitively', async () => {
    const userId = await createTestUser('staff@example.com', 'Staff User');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF001',
      designation: 'Doctor',
      isActive: true,
    });

    const found = await staffRepository.findNonDeletedByStaffCode(tenantA, 'stf001');
    expect(found).toMatchObject({
      id: userId,
      email: 'staff@example.com',
      staffCode: 'STF001',
    });
  });

  it('should not find staff by staff code for another tenant', async () => {
    const userId = await createTestUser('staff2@example.com', 'Staff User 2');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF002',
      designation: 'Nurse',
      isActive: true,
    });

    const found = await staffRepository.findNonDeletedByStaffCode(tenantB, 'STF002');
    expect(found).toBeUndefined();
  });

  it('should not find soft-deleted staff by staff code', async () => {
    const userId = await createTestUser('staff3@example.com', 'Staff User 3');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF003',
      designation: 'Receptionist',
      isActive: true,
      isDeleted: true,
      deletedOn: new Date(),
    });

    const found = await staffRepository.findNonDeletedByStaffCode(tenantA, 'STF003');
    expect(found).toBeUndefined();
  });

  it('should find staff by staff code excluding specific user id', async () => {
    const userId1 = await createTestUser('staff4@example.com', 'Staff User 4');
    const userId2 = await createTestUser('staff5@example.com', 'Staff User 5');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    // Only one active staff can hold a given code per tenant (partial unique index),
    // so seed a single holder and exercise the excludeUserId behavior used on update.
    await db.insert(staffProfileTable).values({
      userId: userId1,
      tenantId: tenantA,
      staffCode: 'STF004',
      designation: 'Doctor',
      isActive: true,
    });

    // Found when excluding a different user (the code is taken by userId1)...
    const found = await staffRepository.findNonDeletedByStaffCode(tenantA, 'STF004', {
      excludeUserId: userId2,
    });
    expect(found?.id).toBe(userId1);

    // ...but excluded when checking against the holder itself.
    const excludingHolder = await staffRepository.findNonDeletedByStaffCode(tenantA, 'STF004', {
      excludeUserId: userId1,
    });
    expect(excludingHolder).toBeUndefined();
  });

  it('should get staff by user id for tenant', async () => {
    const userId = await createTestUser('staff6@example.com', 'Staff User 6');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF006',
      designation: 'Pharmacist',
      gender: 'Female',
      dateOfBirth: '1990-01-01',
      isActive: true,
    });

    const staff = await staffRepository.getStaffByUserId(userId, tenantA);
    expect(staff).toMatchObject({
      id: userId,
      email: 'staff6@example.com',
      staffCode: 'STF006',
      designation: 'Pharmacist',
      gender: 'Female',
      isActive: true,
    });
  });

  it('should not get staff by user id for another tenant', async () => {
    const userId = await createTestUser('staff7@example.com', 'Staff User 7');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF007',
      designation: 'Lab Tech',
      isActive: true,
    });

    const staff = await staffRepository.getStaffByUserId(userId, tenantB);
    expect(staff).toBeUndefined();
  });

  it('should not get soft-deleted staff by user id', async () => {
    const userId = await createTestUser('staff8@example.com', 'Staff User 8');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'STF008',
      designation: 'Billing Staff',
      isActive: true,
      isDeleted: true,
      deletedOn: new Date(),
    });

    const staff = await staffRepository.getStaffByUserId(userId, tenantA);
    expect(staff).toBeUndefined();
  });

  it('should list staff for tenant with pagination', async () => {
    const userId1 = await createTestUser('staff9@example.com', 'Alice Smith');
    const userId2 = await createTestUser('staff10@example.com', 'Bob Jones');
    const userId3 = await createTestUser('staff11@example.com', 'Charlie Brown');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values([
      {
        userId: userId1,
        tenantId: tenantA,
        staffCode: 'STF009',
        designation: 'Doctor',
        isActive: true,
      },
      {
        userId: userId2,
        tenantId: tenantA,
        staffCode: 'STF010',
        designation: 'Nurse',
        isActive: true,
      },
      {
        userId: userId3,
        tenantId: tenantA,
        staffCode: 'STF011',
        designation: 'Doctor',
        isActive: true,
      },
    ]);

    const result = await staffRepository.getStaff({ tenantId: tenantA, page: 1, limit: 2 });
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(2);
  });

  it('should filter staff by search query across name, email, and staff code', async () => {
    const userId = await createTestUser('searchable@example.com', 'Searchable Name');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'SRCH001',
      designation: 'Doctor',
      isActive: true,
    });

    const resultByName = await staffRepository.getStaff({ tenantId: tenantA, query: 'searchable' });
    expect(resultByName.data.map((s) => s.id)).toContain(userId);

    const resultByCode = await staffRepository.getStaff({ tenantId: tenantA, query: 'SRCH' });
    expect(resultByCode.data.map((s) => s.id)).toContain(userId);

    const resultByEmail = await staffRepository.getStaff({
      tenantId: tenantA,
      query: 'searchable',
    });
    expect(resultByEmail.data.map((s) => s.id)).toContain(userId);
  });

  it('should filter staff by active status', async () => {
    const userIdActive = await createTestUser('active@example.com', 'Active Staff');
    const userIdInactive = await createTestUser('inactive@example.com', 'Inactive Staff');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values([
      {
        userId: userIdActive,
        tenantId: tenantA,
        staffCode: 'ACT001',
        designation: 'Doctor',
        isActive: true,
      },
      {
        userId: userIdInactive,
        tenantId: tenantA,
        staffCode: 'INA001',
        designation: 'Nurse',
        isActive: false,
      },
    ]);

    const activeResult = await staffRepository.getStaff({ tenantId: tenantA, status: 'active' });
    expect(activeResult.data.map((s) => s.id)).toEqual([userIdActive]);

    const inactiveResult = await staffRepository.getStaff({
      tenantId: tenantA,
      status: 'inactive',
    });
    expect(inactiveResult.data.map((s) => s.id)).toEqual([userIdInactive]);
  });

  it('should update staff profile fields', async () => {
    const userId = await createTestUser('updatable@example.com', 'Updatable Staff');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'UPD001',
      designation: 'Doctor',
      gender: 'Male',
      isActive: true,
    });

    const updated = await staffRepository.updateStaff(userId, tenantA, {
      designation: 'Senior Doctor',
      gender: 'Female',
      staffCode: 'UPD002',
    });

    expect(updated).toMatchObject({
      id: userId,
      designation: 'Senior Doctor',
      gender: 'Female',
      staffCode: 'UPD002',
    });
  });

  it('should update staff user name and phone', async () => {
    const userId = await createTestUser('nameupdatable@example.com', 'Original Name');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'NAM001',
      designation: 'Doctor',
      isActive: true,
    });

    const updated = await staffRepository.updateStaff(userId, tenantA, {
      name: 'Updated Name',
      phone: '+1234567890',
    });

    expect(updated).toMatchObject({
      id: userId,
      name: 'Updated Name',
      phone: '+1234567890',
    });
  });

  it('should set staff active status', async () => {
    const userId = await createTestUser('activatable@example.com', 'Activatable Staff');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'ACT002',
      designation: 'Doctor',
      isActive: true,
    });

    // Deactivate staff
    const deactivated = await staffRepository.setStaffActive(userId, tenantA, false);
    expect(deactivated?.isActive).toBe(false);

    // Reactivate staff
    const reactivated = await staffRepository.setStaffActive(userId, tenantA, true);
    expect(reactivated?.isActive).toBe(true);
  });

  it('should return undefined when updating non-existent staff', async () => {
    const userId = 'non-existent-user-id';
    const updated = await staffRepository.updateStaff(userId, tenantA, {
      designation: 'Senior Doctor',
    });
    expect(updated).toBeUndefined();
  });

  it('should return undefined when setting active status for non-existent staff', async () => {
    const userId = 'non-existent-user-id';
    const updated = await staffRepository.setStaffActive(userId, tenantA, false);
    expect(updated).toBeUndefined();
  });

  it('should include roles in staff list', async () => {
    const userId = await createTestUser('staffwithroles@example.com', 'Staff With Roles');
    const role = await createTestRole(tenantA, 'Doctor', 'DOC');
    const { db } = await import('@/app/db');
    const { staffProfile: staffProfileTable } = await import('@/app/db/schema/staff-profile');
    const { userRole: userRoleTable } = await import('@/app/db/schema/user-role');

    await db.insert(staffProfileTable).values({
      userId,
      tenantId: tenantA,
      staffCode: 'ROL001',
      designation: 'Doctor',
      isActive: true,
    });

    await db.insert(userRoleTable).values({
      userId,
      tenantId: tenantA,
      roleId: role.id,
      assignedBy: userId,
    });

    const result = await staffRepository.getStaff({ tenantId: tenantA });
    const staffWithRoles = result.data.find((s) => s.id === userId);
    expect(staffWithRoles?.roles).toEqual([{ id: role.id, name: 'Doctor' }]);
  });
});
