import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { member, organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { role as roleTable } from '@/app/db/schema/role';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { staffProfile as staffProfileTable } from '@/app/db/schema/staff-profile';
import { staffRepository } from '../../staff/repository/staff-repository';
import { StaffTenantMembershipConflictError } from '../../staff/errors/staff-tenant-membership-conflict-error';
import { doctorRepository } from './doctor-repository';

let sequence = 0;

async function createTenant(tenantId: string) {
  await db.insert(organization).values({
    id: tenantId,
    name: `Hospital ${tenantId}`,
    slug: `hospital-${tenantId}`,
    createdAt: new Date(),
  });
}

async function createUser(id: string, name = 'Admin User') {
  sequence += 1;
  await db.insert(user).values({ id, name, email: `${id}-${sequence}@example.com` });
}

async function createTenantFixtures(tenantId: string) {
  const adminId = `${tenantId}-admin`;

  await createTenant(tenantId);
  await createUser(adminId);
  const [role] = await db
    .insert(roleTable)
    .values({
      name: 'Doctor',
      code: 'DOCTOR',
      tenantId,
      isSystem: true,
      description: 'Doctor role',
    })
    .returning({ id: roleTable.id });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: 'Cardiology', code: 'CARD', tenantId })
    .returning({ id: specialtyTable.id });

  return { assignedBy: adminId, roleId: role.id, specialtyId: specialty.id };
}

async function createDoctor(
  tenantId: string,
  userId: string,
  registrationNumber: string,
  overrides: { name?: string; specialtyId?: number; roleId?: number; assignedBy?: string } = {}
) {
  await createUser(userId, overrides.name ?? 'Anita Mehta');

  return doctorRepository.createDoctor({
    name: overrides.name ?? 'Anita Mehta',
    email: `${userId}@example.com`,
    password: 'password123',
    userId,
    tenantId,
    roleId: overrides.roleId!,
    assignedBy: overrides.assignedBy!,
    specialtyId: overrides.specialtyId!,
    registrationNumber,
  });
}

describe('Doctor repository', () => {
  it('should create and read the joined Doctor projection', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);

    expect(created).toMatchObject({
      id: 1,
      name: 'Anita Mehta',
      userId: 'doctor-1',
      tenantId: 'tenant-a',
      specialtyName: 'Cardiology',
      registrationNumber: 'TN-123',
      isActive: true,
    });
    await expect(doctorRepository.findByUserId('tenant-a', 'doctor-1')).resolves.toMatchObject({
      id: created.id,
    });
  });

  it('should hide a Doctor ID from another Tenant', async () => {
    const tenantA = await createTenantFixtures('tenant-a');
    await createTenantFixtures('tenant-b');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', tenantA);

    await expect(doctorRepository.getDoctorById(created.id, 'tenant-b')).resolves.toBeUndefined();
  });

  it('should reject provisioning a Doctor user who already belongs to another Tenant', async () => {
    const tenantA = await createTenantFixtures('tenant-a');
    await createTenantFixtures('tenant-b');
    await createUser('doctor-1');
    await db.insert(member).values({
      id: 'doctor-1-tenant-b',
      userId: 'doctor-1',
      role: 'member',
      organizationId: 'tenant-b',
      createdAt: new Date(),
    });

    await expect(
      doctorRepository.createDoctor({
        name: 'Anita Mehta',
        email: 'doctor-1@example.com',
        password: 'password123',
        userId: 'doctor-1',
        tenantId: 'tenant-a',
        roleId: tenantA.roleId,
        assignedBy: tenantA.assignedBy,
        specialtyId: tenantA.specialtyId,
        registrationNumber: 'TN-123',
      })
    ).rejects.toBeInstanceOf(StaffTenantMembershipConflictError);
  });

  it('should keep a Doctor visible and manageable after its Specialty is soft-deleted', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);
    await db
      .update(specialtyTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(specialtyTable.id, fixtures.specialtyId));

    await expect(doctorRepository.getDoctorById(created.id, 'tenant-a')).resolves.toMatchObject({
      id: created.id,
      specialtyName: null,
    });
    await expect(doctorRepository.getDoctors({ tenantId: 'tenant-a' })).resolves.toMatchObject({
      data: [{ id: created.id, specialtyName: null }],
      total: 1,
    });
    await expect(
      doctorRepository.findActiveByRegistrationNumber('tenant-a', 'TN-123')
    ).resolves.toMatchObject({ id: created.id, specialtyName: null });
    await expect(doctorRepository.findByUserId('tenant-a', 'doctor-1')).resolves.toMatchObject({
      id: created.id,
      specialtyName: null,
    });
    await expect(
      doctorRepository.setDoctorActive(created.id, 'tenant-a', false)
    ).resolves.toMatchObject({ id: created.id, isActive: false, specialtyName: null });
  });

  it('should enforce case-insensitive registration uniqueness per Tenant', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);

    await expect(createDoctor('tenant-a', 'doctor-2', 'tn-123', fixtures)).rejects.toMatchObject({
      cause: { code: '23505' },
    });
  });

  it('should update person and clinical fields in one operation', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);
    const [neurology] = await db
      .insert(specialtyTable)
      .values({ name: 'Neurology', code: 'NEUR', tenantId: 'tenant-a' })
      .returning({ id: specialtyTable.id });

    await expect(
      doctorRepository.updateDoctor(created.id, {
        tenantId: 'tenant-a',
        name: 'Dr Anita Rao',
        staffCode: 'DOC-2',
        specialtyId: neurology.id,
        qualifications: 'MBBS, DM',
      })
    ).resolves.toMatchObject({
      name: 'Dr Anita Rao',
      staffCode: 'DOC-2',
      specialtyName: 'Neurology',
      qualifications: 'MBBS, DM',
    });
  });

  it('should paginate, search, and filter Doctors', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    await createDoctor('tenant-a', 'doctor-1', 'TN-123', { ...fixtures, name: 'Anita Mehta' });
    await createDoctor('tenant-a', 'doctor-2', 'TN-456', { ...fixtures, name: 'Basil Joseph' });
    const second = await doctorRepository.findByUserId('tenant-a', 'doctor-2');
    await doctorRepository.setDoctorActive(second!.id, 'tenant-a', false);

    await expect(
      doctorRepository.getDoctors({ tenantId: 'tenant-a', query: 'Anita', status: 'active' })
    ).resolves.toMatchObject({ data: [{ name: 'Anita Mehta' }], total: 1 });
    await expect(
      doctorRepository.getDoctors({ tenantId: 'tenant-a', status: 'inactive' })
    ).resolves.toMatchObject({ data: [{ name: 'Basil Joseph' }], total: 1 });
  });

  it('should couple Doctor-initiated active state to Staff and login', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);

    await doctorRepository.setDoctorActive(created.id, 'tenant-a', false);

    const [profile] = await db
      .select({ isActive: staffProfileTable.isActive })
      .from(staffProfileTable)
      .where(eq(staffProfileTable.userId, 'doctor-1'));
    const [authUser] = await db
      .select({ banned: user.banned })
      .from(user)
      .where(eq(user.id, 'doctor-1'));
    expect(profile.isActive).toBe(false);
    expect(authUser.banned).toBe(true);
  });

  it('should couple Staff-initiated active state to the linked Doctor', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await createDoctor('tenant-a', 'doctor-1', 'TN-123', fixtures);

    await staffRepository.setStaffActive('doctor-1', 'tenant-a', false);

    const [row] = await db
      .select({ isActive: doctorTable.isActive })
      .from(doctorTable)
      .where(and(eq(doctorTable.id, created.id), eq(doctorTable.tenantId, 'tenant-a')));
    expect(row.isActive).toBe(false);
  });
});
