import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userAuditRepository } from '../repository/user-audit-repository';
import { AUDIT_ACTIONS, AUDIT_MODULES, isAuditAction } from '../schemas/audit-action-catalogue';
import { USER_AUDIT_DETAIL_LIMIT, type UserAuditDetail } from '../schemas/user-audit-schema';
import { validateGetUserAuditDetail } from '../validator/get-user-audit-validator';
import { buildUserSessions } from './build-user-sessions';

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

// IP addresses and devices are listed up to this many each.
const BREAKDOWN_LIMIT = 50;

function moduleCounts(rows: { action: string; count: number }[]) {
  const counts = new Map<string, number>();

  for (const { action, count } of rows) {
    const auditModule = isAuditAction(action) ? AUDIT_ACTIONS[action].module : null;
    if (auditModule) counts.set(auditModule, (counts.get(auditModule) ?? 0) + count);
  }

  return AUDIT_MODULES.flatMap((auditModule) => {
    const count = counts.get(auditModule);
    return count ? [{ module: auditModule, count }] : [];
  });
}

/**
 * Everything the User Audit page shows for one Tenant member: who they are, their
 * Sessions from sign-in to end, failed sign-in attempts, the IP addresses and
 * devices they used, and what they did by Module. A user who is not a member of
 * the Tenant is not found, so one Tenant can never read another's users.
 */
export async function getUserAuditDetailQuery(
  userId: unknown,
  filters: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<UserAuditDetail>> {
  const validationResult = validateGetUserAuditDetail(userId, filters, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { userId: validUserId, ...rangeFilters } = validationResult.data;
  const tenant = await tenantRepository.getTenantById(rangeFilters.tenantId);
  const range = { ...rangeFilters, timeZone: tenant?.timeZone ?? DEFAULT_TIME_ZONE };
  const member = await userAuditRepository.getUserAuditMember(range, validUserId);

  if (!member) {
    return { success: false, errors: ['User not found'], status: StatusCodes.NOT_FOUND };
  }

  // One extra row tells whether the Session list was cut.
  const [signIns, liveSessions, failedSignIns, ipAddresses, devices, actionCounts, distinct] =
    await Promise.all([
      userAuditRepository.getSignIns(range, validUserId, USER_AUDIT_DETAIL_LIMIT + 1),
      userAuditRepository.getLiveSessions(range.tenantId, validUserId),
      userAuditRepository.getFailedSignIns(range, validUserId, USER_AUDIT_DETAIL_LIMIT),
      userAuditRepository.getIpAddresses(range, validUserId, BREAKDOWN_LIMIT),
      userAuditRepository.getDevices(range, validUserId, BREAKDOWN_LIMIT),
      userAuditRepository.getActionCounts(range, validUserId),
      userAuditRepository.countDistinctInRange(range, validUserId),
    ]);

  const listedSignIns = signIns.slice(0, USER_AUDIT_DETAIL_LIMIT);
  const earliest = [
    ...listedSignIns.map((s) => s.occurredOn),
    ...liveSessions.map((s) => s.createdAt),
  ].reduce<Date | null>((min, at) => (min === null || at < min ? at : min), null);
  const sessionIds = [
    ...new Set([...listedSignIns.map((s) => s.sessionId), ...liveSessions.map((s) => s.id)]),
  ];

  const [endEvents, activity] = await Promise.all([
    earliest
      ? userAuditRepository.getSessionEndEvents(range.tenantId, validUserId, earliest)
      : Promise.resolve([]),
    userAuditRepository.getSessionActivity(range.tenantId, sessionIds),
  ]);

  const sessions = buildUserSessions({
    userId: validUserId,
    now: new Date(),
    signIns: listedSignIns,
    endEvents,
    activity,
    liveSessions,
  });

  return {
    success: true,
    data: {
      timeZone: range.timeZone,
      user: {
        userId: member.userId,
        name: member.name,
        email: member.email,
        roles: member.roles,
        isActive: member.isActive,
        staffCode: member.staffCode,
        memberSince: member.memberSince,
        accountCreatedAt: member.accountCreatedAt,
      },
      summary: {
        signInCount: member.signInCount,
        failedSignInCount: member.failedSignInCount,
        actionCount: member.actionCount,
        activeSessionCount: member.activeSessionCount,
        ipAddressCount: distinct.ipAddressCount,
        deviceCount: distinct.deviceCount,
        lastSignInAt: member.lastSignInAt,
        lastActivityAt: member.lastActivityAt,
      },
      sessions,
      sessionsTruncated: signIns.length > USER_AUDIT_DETAIL_LIMIT,
      failedSignIns,
      ipAddresses,
      devices,
      activityByModule: moduleCounts(actionCounts),
    },
  };
}
