import { generateId } from '@better-auth/core/utils/id';
import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, session, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { staffProfile as staffProfileTable } from '@/app/db/schema/staff-profile';
import { userRole as userRoleTable } from '@/app/db/schema/user-role';
import type {
  Doctor,
  CreateDoctorData,
  DoctorListParams,
  UpdateDoctorData,
} from '../schemas/doctor-schema';

type DoctorRow = Omit<Doctor, 'gender'> & {
  gender: string | null;
};

function toDoctor(row: DoctorRow): Doctor {
  return {
    ...row,
    gender: row.gender as Doctor['gender'],
  };
}

function normalizePagination(page: number, limit: number) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(999, Math.max(1, Math.floor(limit))) : 10;

  return { page: safePage, limit: safeLimit };
}

const doctorColumns = {
  id: doctorTable.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  userId: doctorTable.userId,
  gender: staffProfileTable.gender,
  tenantId: doctorTable.tenantId,
  isActive: doctorTable.isActive,
  staffCode: staffProfileTable.staffCode,
  createdOn: doctorTable.createdOn,
  modifiedOn: doctorTable.modifiedOn,
  specialtyId: doctorTable.specialtyId,
  dateOfBirth: staffProfileTable.dateOfBirth,
  designation: staffProfileTable.designation,
  specialtyName: specialtyTable.name,
  qualifications: doctorTable.qualifications,
  registrationNumber: doctorTable.registrationNumber,
};

function doctorJoins() {
  return db
    .select(doctorColumns)
    .from(doctorTable)
    .innerJoin(
      staffProfileTable,
      and(
        eq(doctorTable.userId, staffProfileTable.userId),
        eq(doctorTable.tenantId, staffProfileTable.tenantId),
        eq(staffProfileTable.isDeleted, false)
      )
    )
    .innerJoin(user, eq(doctorTable.userId, user.id))
    .innerJoin(
      specialtyTable,
      and(
        eq(doctorTable.specialtyId, specialtyTable.id),
        eq(doctorTable.tenantId, specialtyTable.tenantId),
        eq(specialtyTable.isDeleted, false)
      )
    );
}

async function getDoctorById(id: number, tenantId: string): Promise<Doctor | undefined> {
  const [doctor] = await doctorJoins()
    .where(
      and(
        eq(doctorTable.id, id),
        eq(doctorTable.tenantId, tenantId),
        eq(doctorTable.isDeleted, false)
      )
    )
    .limit(1);

  return doctor ? toDoctor(doctor) : undefined;
}

async function createDoctor(data: CreateDoctorData): Promise<Doctor> {
  const doctorId = await db.transaction(async (tx) => {
    await tx.insert(member).values({
      id: generateId(),
      userId: data.userId,
      organizationId: data.tenantId,
      role: 'member',
      createdAt: new Date(),
    });

    await tx.insert(staffProfileTable).values({
      userId: data.userId,
      tenantId: data.tenantId,
      staffCode: data.staffCode ?? null,
      designation: data.designation ?? null,
      gender: data.gender ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      isActive: true,
    });

    await tx.insert(userRoleTable).values({
      userId: data.userId,
      roleId: data.roleId,
      tenantId: data.tenantId,
      assignedBy: data.assignedBy,
    });

    const [createdDoctor] = await tx
      .insert(doctorTable)
      .values({
        userId: data.userId,
        tenantId: data.tenantId,
        isActive: true,
        specialtyId: data.specialtyId,
        qualifications: data.qualifications ?? null,
        registrationNumber: data.registrationNumber ?? null,
      })
      .returning({ id: doctorTable.id });

    return createdDoctor.id;
  });

  const createdDoctor = await getDoctorById(doctorId, data.tenantId);

  if (!createdDoctor) {
    throw new Error('Created Doctor could not be read');
  }

  return createdDoctor;
}

async function updateDoctor(id: number, data: UpdateDoctorData): Promise<Doctor | undefined> {
  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const doctorUpdate: Partial<typeof doctorTable.$inferInsert> = { modifiedOn: now };

    if (data.specialtyId !== undefined) {
      doctorUpdate.specialtyId = data.specialtyId;
    }

    if (data.registrationNumber !== undefined) {
      doctorUpdate.registrationNumber = data.registrationNumber;
    }

    if (data.qualifications !== undefined) {
      doctorUpdate.qualifications = data.qualifications;
    }

    const [doctor] = await tx
      .update(doctorTable)
      .set(doctorUpdate)
      .where(
        and(
          eq(doctorTable.id, id),
          eq(doctorTable.tenantId, data.tenantId),
          eq(doctorTable.isDeleted, false)
        )
      )
      .returning({ userId: doctorTable.userId });

    if (!doctor) {
      return false;
    }

    const profileUpdate: Partial<typeof staffProfileTable.$inferInsert> = { modifiedOn: now };

    if (data.staffCode !== undefined) {
      profileUpdate.staffCode = data.staffCode;
    }

    if (data.designation !== undefined) {
      profileUpdate.designation = data.designation;
    }

    if (data.gender !== undefined) {
      profileUpdate.gender = data.gender;
    }

    if (data.dateOfBirth !== undefined) {
      profileUpdate.dateOfBirth = data.dateOfBirth;
    }

    const [profile] = await tx
      .update(staffProfileTable)
      .set(profileUpdate)
      .where(
        and(
          eq(staffProfileTable.userId, doctor.userId),
          eq(staffProfileTable.tenantId, data.tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .returning({ userId: staffProfileTable.userId });

    if (!profile) {
      throw new Error('Doctor Staff profile not found');
    }

    if (data.name !== undefined) {
      await tx
        .update(user)
        .set({ name: data.name, updatedAt: now })
        .where(eq(user.id, doctor.userId));
    }

    return true;
  });

  return updated ? getDoctorById(id, data.tenantId) : undefined;
}

async function deleteDoctor(id: number, tenantId: string): Promise<Doctor | undefined> {
  const existingDoctor = await getDoctorById(id, tenantId);

  if (!existingDoctor) {
    return undefined;
  }

  const deletedOn = new Date();
  const [deletedDoctor] = await db
    .update(doctorTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(doctorTable.id, id),
        eq(doctorTable.tenantId, tenantId),
        eq(doctorTable.isDeleted, false)
      )
    )
    .returning({ id: doctorTable.id });

  return deletedDoctor ? existingDoctor : undefined;
}

async function setDoctorActive(
  id: number,
  tenantId: string,
  isActive: boolean
): Promise<Doctor | undefined> {
  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const [doctor] = await tx
      .update(doctorTable)
      .set({ isActive, modifiedOn: now })
      .where(
        and(
          eq(doctorTable.id, id),
          eq(doctorTable.tenantId, tenantId),
          eq(doctorTable.isDeleted, false)
        )
      )
      .returning({ userId: doctorTable.userId });

    if (!doctor) {
      return false;
    }

    const [staff] = await tx
      .update(staffProfileTable)
      .set({ isActive, modifiedOn: now })
      .where(
        and(
          eq(staffProfileTable.userId, doctor.userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .returning({ userId: staffProfileTable.userId });

    if (!staff) {
      throw new Error('Doctor Staff profile not found');
    }

    await tx
      .update(user)
      .set({
        banned: !isActive,
        banReason: isActive ? null : 'Staff deactivated',
        banExpires: null,
        updatedAt: now,
      })
      .where(eq(user.id, doctor.userId));

    if (!isActive) {
      await tx.delete(session).where(eq(session.userId, doctor.userId));
    }

    return true;
  });

  return updated ? getDoctorById(id, tenantId) : undefined;
}

async function getDoctors({
  tenantId,
  page = 1,
  limit = 10,
  query,
  specialtyId,
  status,
}: DoctorListParams): Promise<{ data: Doctor[]; total: number }> {
  const pagination = normalizePagination(page, limit);
  const offset = (pagination.page - 1) * pagination.limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(user.name, `%${trimmedQuery}%`),
        ilike(user.email, `%${trimmedQuery}%`),
        ilike(staffProfileTable.staffCode, `%${trimmedQuery}%`),
        ilike(doctorTable.registrationNumber, `%${trimmedQuery}%`)
      )
    : undefined;
  const specialtyCondition =
    specialtyId === undefined ? undefined : eq(doctorTable.specialtyId, specialtyId);
  const statusCondition =
    status === undefined ? undefined : eq(doctorTable.isActive, status === 'active');
  const whereClause = and(
    eq(doctorTable.tenantId, tenantId),
    eq(doctorTable.isDeleted, false),
    searchCondition,
    specialtyCondition,
    statusCondition
  );

  const [data, [{ total }]] = await Promise.all([
    doctorJoins()
      .where(whereClause)
      .orderBy(asc(user.name), asc(doctorTable.id))
      .limit(pagination.limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(doctorTable)
      .innerJoin(
        staffProfileTable,
        and(
          eq(doctorTable.userId, staffProfileTable.userId),
          eq(doctorTable.tenantId, staffProfileTable.tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .innerJoin(user, eq(doctorTable.userId, user.id))
      .innerJoin(
        specialtyTable,
        and(
          eq(doctorTable.specialtyId, specialtyTable.id),
          eq(doctorTable.tenantId, specialtyTable.tenantId),
          eq(specialtyTable.isDeleted, false)
        )
      )
      .where(whereClause),
  ]);

  return { data: data.map(toDoctor), total };
}

async function findActiveByRegistrationNumber(
  tenantId: string,
  registrationNumber: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<Doctor | undefined> {
  const [doctor] = await doctorJoins()
    .where(
      and(
        eq(doctorTable.tenantId, tenantId),
        eq(doctorTable.isDeleted, false),
        sql`lower(${doctorTable.registrationNumber}) = ${registrationNumber.toLowerCase()}`,
        excludeId ? ne(doctorTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return doctor ? toDoctor(doctor) : undefined;
}

async function findByUserId(tenantId: string, userId: string): Promise<Doctor | undefined> {
  const [doctor] = await doctorJoins()
    .where(
      and(
        eq(doctorTable.userId, userId),
        eq(doctorTable.tenantId, tenantId),
        eq(doctorTable.isDeleted, false)
      )
    )
    .limit(1);

  return doctor ? toDoctor(doctor) : undefined;
}

export const doctorRepository = {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorById,
  findByUserId,
  setDoctorActive,
  findActiveByRegistrationNumber,
};
