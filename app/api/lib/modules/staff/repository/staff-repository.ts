import { generateId } from '@better-auth/core/utils/id';
import { and, asc, count, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, session, user } from '@/app/db/schema/auth';
import { roleTable } from '@/app/db/schema/role';
import { staffProfileTable } from '@/app/db/schema/staff-profile';
import { userRoleTable } from '@/app/db/schema/user-role';
import type {
  CreateStaffInput,
  Staff,
  StaffListParams,
  StaffRoleSummary,
  StaffWithRoles,
  UpdateStaffInput,
} from '../schemas/staff-schema';

const staffColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  staffCode: staffProfileTable.staffCode,
  designation: staffProfileTable.designation,
  gender: staffProfileTable.gender,
  dateOfBirth: staffProfileTable.dateOfBirth,
  isActive: staffProfileTable.isActive,
  createdOn: staffProfileTable.createdOn,
  modifiedOn: staffProfileTable.modifiedOn,
};

type StaffRow = Omit<Staff, 'gender'> & {
  gender: string | null;
};

function toStaff(row: StaffRow): Staff {
  return {
    ...row,
    gender: row.gender as Staff['gender'],
  };
}

async function findUserByEmail(email: string) {
  const [existingUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
    .limit(1);

  return existingUser;
}

async function getStaffByUserId(userId: string, tenantId: string) {
  const [staff] = await db
    .select(staffColumns)
    .from(staffProfileTable)
    .innerJoin(user, eq(staffProfileTable.userId, user.id))
    .where(
      and(
        eq(staffProfileTable.userId, userId),
        eq(staffProfileTable.tenantId, tenantId),
        eq(staffProfileTable.isDeleted, false)
      )
    )
    .limit(1);

  return staff ? toStaff(staff) : undefined;
}

async function getRolesByUserIds(
  userIds: string[],
  tenantId: string
): Promise<Map<string, StaffRoleSummary[]>> {
  const rolesByUser = new Map<string, StaffRoleSummary[]>();

  if (userIds.length === 0) {
    return rolesByUser;
  }

  const roleRows = await db
    .select({ userId: userRoleTable.userId, id: roleTable.id, name: roleTable.name })
    .from(userRoleTable)
    .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
    .where(
      and(
        inArray(userRoleTable.userId, userIds),
        eq(userRoleTable.tenantId, tenantId),
        eq(roleTable.tenantId, tenantId),
        eq(roleTable.isDeleted, false)
      )
    )
    .orderBy(asc(roleTable.name), asc(roleTable.id));

  for (const row of roleRows) {
    const existing = rolesByUser.get(row.userId);

    if (existing) {
      existing.push({ id: row.id, name: row.name });
    } else {
      rolesByUser.set(row.userId, [{ id: row.id, name: row.name }]);
    }
  }

  return rolesByUser;
}

async function getStaff({
  tenantId,
  page = 1,
  limit = 10,
  query,
  roleId,
  status,
}: StaffListParams): Promise<{ data: StaffWithRoles[]; total: number }> {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(user.name, `%${trimmedQuery}%`),
        ilike(user.email, `%${trimmedQuery}%`),
        ilike(staffProfileTable.staffCode, `%${trimmedQuery}%`)
      )
    : undefined;
  const statusCondition =
    status === undefined ? undefined : eq(staffProfileTable.isActive, status === 'active');
  const roleCondition =
    roleId === undefined
      ? undefined
      : inArray(
          staffProfileTable.userId,
          db
            .select({ userId: userRoleTable.userId })
            .from(userRoleTable)
            .where(and(eq(userRoleTable.roleId, roleId), eq(userRoleTable.tenantId, tenantId)))
        );
  const whereClause = and(
    eq(staffProfileTable.tenantId, tenantId),
    eq(staffProfileTable.isDeleted, false),
    searchCondition,
    statusCondition,
    roleCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(staffColumns)
      .from(staffProfileTable)
      .innerJoin(user, eq(staffProfileTable.userId, user.id))
      .where(whereClause)
      .orderBy(asc(user.name), asc(user.email), asc(staffProfileTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(staffProfileTable)
      .innerJoin(user, eq(staffProfileTable.userId, user.id))
      .where(whereClause),
  ]);

  const rolesByUser = await getRolesByUserIds(
    data.map((row) => row.id),
    tenantId
  );

  return {
    data: data.map((row) => ({ ...toStaff(row), roles: rolesByUser.get(row.id) ?? [] })),
    total,
  };
}

async function findNonDeletedByStaffCode(
  tenantId: string,
  staffCode: string,
  { excludeUserId }: { excludeUserId?: string } = {}
) {
  const [staff] = await db
    .select(staffColumns)
    .from(staffProfileTable)
    .innerJoin(user, eq(staffProfileTable.userId, user.id))
    .where(
      and(
        eq(staffProfileTable.tenantId, tenantId),
        eq(staffProfileTable.isDeleted, false),
        sql`lower(${staffProfileTable.staffCode}) = ${staffCode.toLowerCase()}`,
        excludeUserId ? ne(staffProfileTable.userId, excludeUserId) : undefined
      )
    )
    .limit(1);

  return staff ? toStaff(staff) : undefined;
}

async function createStaffProfile(
  userId: string,
  tenantId: string,
  data: CreateStaffInput,
  assignedBy: string
) {
  await db.transaction(async (tx) => {
    await tx.insert(member).values({
      id: generateId(),
      organizationId: tenantId,
      userId,
      role: 'member',
      createdAt: new Date(),
    });

    await tx.insert(staffProfileTable).values({
      userId,
      tenantId,
      staffCode: data.staffCode ?? null,
      designation: data.designation ?? null,
      gender: data.gender ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      isActive: true,
    });

    await tx.insert(userRoleTable).values(
      data.roleIds.map((roleId) => ({
        userId,
        tenantId,
        roleId,
        assignedBy,
      }))
    );
  });

  return getStaffByUserId(userId, tenantId);
}

async function updateStaff(userId: string, tenantId: string, data: UpdateStaffInput) {
  const updatedStaff = await db.transaction(async (tx) => {
    const profileUpdate: Partial<typeof staffProfileTable.$inferInsert> = {
      modifiedOn: new Date(),
    };

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
          eq(staffProfileTable.userId, userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .returning({ userId: staffProfileTable.userId });

    if (!profile) {
      return undefined;
    }

    const userUpdate: Partial<typeof user.$inferInsert> = {};

    if (data.name !== undefined) {
      userUpdate.name = data.name;
    }

    if (data.phone !== undefined) {
      userUpdate.phone = data.phone;
    }

    if (Object.keys(userUpdate).length > 0) {
      userUpdate.updatedAt = new Date();

      await tx.update(user).set(userUpdate).where(eq(user.id, userId));
    }

    const [staff] = await tx
      .select(staffColumns)
      .from(staffProfileTable)
      .innerJoin(user, eq(staffProfileTable.userId, user.id))
      .where(
        and(
          eq(staffProfileTable.userId, userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .limit(1);

    return staff ? toStaff(staff) : undefined;
  });

  return updatedStaff;
}

async function setStaffActive(userId: string, tenantId: string, isActive: boolean) {
  const updatedStaff = await db.transaction(async (tx) => {
    const now = new Date();
    const [profile] = await tx
      .update(staffProfileTable)
      .set({
        isActive,
        modifiedOn: now,
      })
      .where(
        and(
          eq(staffProfileTable.userId, userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .returning({ userId: staffProfileTable.userId });

    if (!profile) {
      return undefined;
    }

    await tx
      .update(user)
      .set({
        banned: !isActive,
        banReason: isActive ? null : 'Staff deactivated',
        banExpires: null,
        updatedAt: now,
      })
      .where(eq(user.id, userId));

    if (!isActive) {
      await tx.delete(session).where(eq(session.userId, userId));
    }

    const [staff] = await tx
      .select(staffColumns)
      .from(staffProfileTable)
      .innerJoin(user, eq(staffProfileTable.userId, user.id))
      .where(
        and(
          eq(staffProfileTable.userId, userId),
          eq(staffProfileTable.tenantId, tenantId),
          eq(staffProfileTable.isDeleted, false)
        )
      )
      .limit(1);

    return staff ? toStaff(staff) : undefined;
  });

  return updatedStaff;
}

async function deleteAuthUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

export const staffRepository = {
  findUserByEmail,
  getStaffByUserId,
  getStaff,
  findNonDeletedByStaffCode,
  createStaffProfile,
  updateStaff,
  setStaffActive,
  deleteAuthUser,
};
