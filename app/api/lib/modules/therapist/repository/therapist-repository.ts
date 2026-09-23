import { and, asc, count, eq, exists, gte, ilike, inArray, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, session, user } from '@/app/db/schema/auth';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { staffProfile as staffProfileTable } from '@/app/db/schema/staff-profile';
import { therapistSkill as therapistSkillTable } from '@/app/db/schema/therapist-skill';
import { therapistSkillAssignment as assignmentTable } from '@/app/db/schema/therapist-skill-assignment';
import { therapist as therapistTable } from '@/app/db/schema/therapist';
import { userRole as userRoleTable } from '@/app/db/schema/user-role';
import { StaffTenantMembershipConflictError } from '../../staff/errors/staff-tenant-membership-conflict-error';
import type {
  CreateTherapistData,
  Therapist,
  TherapistListParams,
  TherapistSkillSummary,
  UpdateTherapistData,
} from '../schemas/therapist-schema';

type TherapistBase = Omit<Therapist, 'gender' | 'skills'> & { gender: string | null };

const baseColumns = {
  id: therapistTable.id,
  tenantId: therapistTable.tenantId,
  userId: therapistTable.userId,
  name: user.name,
  email: user.email,
  phone: user.phone,
  staffCode: staffProfileTable.staffCode,
  designation: staffProfileTable.designation,
  gender: staffProfileTable.gender,
  dateOfBirth: staffProfileTable.dateOfBirth,
  qualifications: therapistTable.qualifications,
  registrationNumber: therapistTable.registrationNumber,
  isActive: therapistTable.isActive,
  createdOn: therapistTable.createdOn,
  modifiedOn: therapistTable.modifiedOn,
};

function therapistJoins() {
  return db
    .select(baseColumns)
    .from(therapistTable)
    .innerJoin(
      staffProfileTable,
      and(
        eq(therapistTable.userId, staffProfileTable.userId),
        eq(therapistTable.tenantId, staffProfileTable.tenantId),
        eq(staffProfileTable.isDeleted, false)
      )
    )
    .innerJoin(user, eq(therapistTable.userId, user.id));
}

async function getSkills(therapistIds: number[], tenantId: string) {
  if (therapistIds.length === 0) return new Map<number, TherapistSkillSummary[]>();
  const rows = await db
    .select({
      therapistId: assignmentTable.therapistId,
      id: therapistSkillTable.id,
      name: therapistSkillTable.name,
      code: therapistSkillTable.code,
    })
    .from(assignmentTable)
    .innerJoin(therapistSkillTable, eq(assignmentTable.therapistSkillId, therapistSkillTable.id))
    .where(
      and(
        eq(assignmentTable.tenantId, tenantId),
        inArray(assignmentTable.therapistId, therapistIds),
        eq(therapistSkillTable.isDeleted, false)
      )
    )
    .orderBy(asc(therapistSkillTable.name));
  const result = new Map<number, TherapistSkillSummary[]>();
  for (const row of rows) {
    const skills = result.get(row.therapistId) ?? [];
    skills.push({ id: row.id, name: row.name, code: row.code });
    result.set(row.therapistId, skills);
  }
  return result;
}

function toTherapist(
  row: TherapistBase,
  skillMap: Map<number, TherapistSkillSummary[]>
): Therapist {
  return {
    ...row,
    gender: row.gender as Therapist['gender'],
    skills: skillMap.get(row.id) ?? [],
  };
}

async function getTherapistById(id: number, tenantId: string): Promise<Therapist | undefined> {
  const [row] = await therapistJoins()
    .where(
      and(
        eq(therapistTable.id, id),
        eq(therapistTable.tenantId, tenantId),
        eq(therapistTable.isDeleted, false)
      )
    )
    .limit(1);
  if (!row) return undefined;
  return toTherapist(row, await getSkills([id], tenantId));
}

async function getTherapists({
  tenantId,
  page = 1,
  limit = 10,
  query,
  status,
  therapistSkillId,
}: TherapistListParams) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(user.name, `%${trimmedQuery}%`),
        ilike(user.email, `%${trimmedQuery}%`),
        ilike(staffProfileTable.staffCode, `%${trimmedQuery}%`),
        ilike(therapistTable.registrationNumber, `%${trimmedQuery}%`)
      )
    : undefined;
  const skillCondition = therapistSkillId
    ? exists(
        db
          .select({ id: assignmentTable.id })
          .from(assignmentTable)
          .where(
            and(
              eq(assignmentTable.therapistId, therapistTable.id),
              eq(assignmentTable.tenantId, tenantId),
              eq(assignmentTable.therapistSkillId, therapistSkillId)
            )
          )
      )
    : undefined;
  const whereClause = and(
    eq(therapistTable.tenantId, tenantId),
    eq(therapistTable.isDeleted, false),
    searchCondition,
    skillCondition,
    status ? eq(therapistTable.isActive, status === 'active') : undefined
  );
  const [rows, [{ total }]] = await Promise.all([
    therapistJoins()
      .where(whereClause)
      .orderBy(asc(user.name), asc(therapistTable.id))
      .limit(safeLimit)
      .offset((safePage - 1) * safeLimit),
    db
      .select({ total: count() })
      .from(therapistTable)
      .innerJoin(
        staffProfileTable,
        and(
          eq(therapistTable.userId, staffProfileTable.userId),
          eq(therapistTable.tenantId, staffProfileTable.tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .innerJoin(user, eq(therapistTable.userId, user.id))
      .where(whereClause),
  ]);
  const skillMap = await getSkills(
    rows.map((row) => row.id),
    tenantId
  );
  return { data: rows.map((row) => toTherapist(row, skillMap)), total };
}

async function findActiveByRegistrationNumber(
  tenantId: string,
  registrationNumber: string,
  { excludeId }: { excludeId?: number } = {}
) {
  const [row] = await therapistJoins()
    .where(
      and(
        eq(therapistTable.tenantId, tenantId),
        eq(therapistTable.isDeleted, false),
        sql`lower(${therapistTable.registrationNumber}) = ${registrationNumber.toLowerCase()}`,
        excludeId ? ne(therapistTable.id, excludeId) : undefined
      )
    )
    .limit(1);
  return row ? toTherapist(row, await getSkills([row.id], tenantId)) : undefined;
}

async function createTherapist(data: CreateTherapistData): Promise<Therapist> {
  const therapistId = await db.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, data.userId))
      .for('update')
      .limit(1);
    const [existingMembership] = await tx
      .select({ id: member.id })
      .from(member)
      .where(eq(member.userId, data.userId))
      .limit(1);
    if (existingMembership) throw new StaffTenantMembershipConflictError();
    await tx.insert(member).values({
      id: crypto.randomUUID(),
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
    const [created] = await tx
      .insert(therapistTable)
      .values({
        tenantId: data.tenantId,
        userId: data.userId,
        qualifications: data.qualifications ?? null,
        registrationNumber: data.registrationNumber ?? null,
        isActive: true,
      })
      .returning({ id: therapistTable.id });
    if (data.therapistSkillIds.length > 0) {
      await tx.insert(assignmentTable).values(
        data.therapistSkillIds.map((therapistSkillId) => ({
          tenantId: data.tenantId,
          therapistId: created.id,
          therapistSkillId,
        }))
      );
    }
    return created.id;
  });
  const created = await getTherapistById(therapistId, data.tenantId);
  if (!created) throw new Error('Created Therapist could not be read');
  return created;
}

async function updateTherapist(
  id: number,
  data: UpdateTherapistData
): Promise<Therapist | undefined> {
  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const therapistUpdate: Partial<typeof therapistTable.$inferInsert> = { modifiedOn: now };
    if (data.qualifications !== undefined) therapistUpdate.qualifications = data.qualifications;
    if (data.registrationNumber !== undefined)
      therapistUpdate.registrationNumber = data.registrationNumber;
    const [row] = await tx
      .update(therapistTable)
      .set(therapistUpdate)
      .where(
        and(
          eq(therapistTable.id, id),
          eq(therapistTable.tenantId, data.tenantId),
          eq(therapistTable.isDeleted, false)
        )
      )
      .returning({ userId: therapistTable.userId });
    if (!row) return false;
    const profile: Partial<typeof staffProfileTable.$inferInsert> = { modifiedOn: now };
    for (const field of ['staffCode', 'designation', 'gender', 'dateOfBirth'] as const) {
      if (data[field] !== undefined) profile[field] = data[field] as never;
    }
    await tx
      .update(staffProfileTable)
      .set(profile)
      .where(
        and(
          eq(staffProfileTable.userId, row.userId),
          eq(staffProfileTable.tenantId, data.tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      );
    if (data.name !== undefined)
      await tx.update(user).set({ name: data.name, updatedAt: now }).where(eq(user.id, row.userId));
    if (data.therapistSkillIds !== undefined) {
      await tx
        .delete(assignmentTable)
        .where(
          and(eq(assignmentTable.therapistId, id), eq(assignmentTable.tenantId, data.tenantId))
        );
      if (data.therapistSkillIds.length > 0) {
        await tx.insert(assignmentTable).values(
          data.therapistSkillIds.map((therapistSkillId) => ({
            tenantId: data.tenantId,
            therapistId: id,
            therapistSkillId,
          }))
        );
      }
    }
    return true;
  });
  return updated ? getTherapistById(id, data.tenantId) : undefined;
}

async function setTherapistActive(id: number, tenantId: string, isActive: boolean) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [row] = await tx
      .update(therapistTable)
      .set({ isActive, modifiedOn: now })
      .where(
        and(
          eq(therapistTable.id, id),
          eq(therapistTable.tenantId, tenantId),
          eq(therapistTable.isDeleted, false)
        )
      )
      .returning({ userId: therapistTable.userId });
    if (!row) return undefined;
    await tx
      .update(staffProfileTable)
      .set({ isActive, modifiedOn: now })
      .where(
        and(
          eq(staffProfileTable.userId, row.userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      );
    await tx
      .update(user)
      .set({
        banned: !isActive,
        banReason: isActive ? null : 'Staff deactivated',
        banExpires: null,
        updatedAt: now,
      })
      .where(eq(user.id, row.userId));
    if (!isActive) await tx.delete(session).where(eq(session.userId, row.userId));
    return true;
  });
  return true;
}

async function hasFutureProcedureAppointment(therapistId: number, tenantId: string) {
  const [row] = await db
    .select({ id: appointmentTable.id })
    .from(appointmentTable)
    .innerJoin(
      appointmentStatusTable,
      and(
        eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId),
        eq(appointmentStatusTable.tenantId, appointmentTable.tenantId)
      )
    )
    .where(
      and(
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.therapistId, therapistId),
        eq(appointmentTable.bookingPath, 'PROCEDURE'),
        eq(appointmentTable.isDeleted, false),
        eq(appointmentStatusTable.category, 'SCHEDULED'),
        gte(appointmentTable.slotDate, new Date().toISOString().slice(0, 10))
      )
    )
    .limit(1);
  return Boolean(row);
}

export const therapistRepository = {
  getTherapistById,
  getTherapists,
  findActiveByRegistrationNumber,
  createTherapist,
  updateTherapist,
  setTherapistActive,
  hasFutureProcedureAppointment,
};
