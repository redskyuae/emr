import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { session as sessionTable } from '@/app/db/schema/auth';
import { addOrganizationMember, createTestUser, seedOrganization } from '@/test/helpers';
import { roleRepository } from '../../role/repository/role-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { AUDIT_ACTIONS, type AuditAction } from '../schemas/audit-action-catalogue';
import { auditLogRepository } from './audit-log-repository';
import { userAuditRepository } from './user-audit-repository';

const tenantA = 'tenant-a-user-audit-test';
const tenantB = 'tenant-b-user-audit-test';
const timeZone = 'Asia/Dubai';

async function seedMember(tenantId: string, name: string, membershipRole = 'member') {
  await seedOrganization(tenantId);
  const created = await createTestUser({ name });
  await addOrganizationMember(tenantId, created.id, membershipRole);
  return created;
}

function record(
  tenantId: string,
  userId: string,
  action: AuditAction,
  extra: {
    entityId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  const { category, entityType } = AUDIT_ACTIONS[action];

  return auditLogRepository.recordAuditEvent({
    tenantId,
    action,
    category,
    entityType,
    actorUserId: userId,
    actorName: 'Someone',
    outcome: action === 'auth.sign-in-failed' ? 'failed' : 'success',
    ...extra,
  });
}

async function seedSession(userId: string, tenantId: string, expiresInHours: number) {
  const id = randomUUID();
  await db.insert(sessionTable).values({
    id,
    userId,
    token: randomUUID(),
    activeOrganizationId: tenantId,
    ipAddress: '10.1.1.1',
    userAgent: 'Mozilla/5.0 Safari',
    expiresAt: new Date(Date.now() + expiresInHours * 3_600_000),
  });
  return id;
}

const rangeA = { tenantId: tenantA, timeZone };

describe('User Audit repository', () => {
  it('should list only the Tenant’s members with their figures', async () => {
    const sara = await seedMember(tenantA, 'Sara Ali');
    const outsider = await seedMember(tenantB, 'Layla Noor');
    await record(tenantA, sara.id, 'auth.sign-in', { entityId: 's1', ipAddress: '10.0.0.7' });
    await record(tenantA, sara.id, 'auth.sign-in-failed');
    await record(tenantA, sara.id, 'patient.view');
    await record(tenantA, sara.id, 'visit.view');
    await record(tenantB, outsider.id, 'patient.view');
    await seedSession(sara.id, tenantA, 5);
    await seedSession(sara.id, tenantA, -5);

    const { data, total } = await userAuditRepository.getUserAuditList(rangeA);

    expect(total).toBe(1);
    expect(data[0]).toMatchObject({
      userId: sara.id,
      name: 'Sara Ali',
      isActive: true,
      signInCount: 1,
      failedSignInCount: 1,
      actionCount: 2,
      activeSessionCount: 1,
      lastSignInIp: '10.0.0.7',
    });
    expect(data[0].lastSignInAt).toBeInstanceOf(Date);
  });

  it('should list ownership first, then assigned Roles, each once', async () => {
    const owner = await seedMember(tenantA, 'Owner', 'owner');
    const roles = await roleRepository.seedSystemRolesForTenant(tenantA);
    const tenantAdmin = roles.find(({ code }) => code === 'TENANT_ADMIN');
    const doctor = roles.find(({ code }) => code === 'DOCTOR');
    if (!tenantAdmin || !doctor) throw new Error('System roles were not created');
    await userRoleRepository.assignRoles(owner.id, tenantA, [doctor.id, tenantAdmin.id], owner.id);

    const member = await userAuditRepository.getUserAuditMember(rangeA, owner.id);

    expect(member?.roles).toBe('Tenant Owner, Doctor, Tenant Admin');
  });

  it('should not find a user from another Tenant', async () => {
    const outsider = await seedMember(tenantB, 'Layla Noor');

    await expect(
      userAuditRepository.getUserAuditMember(rangeA, outsider.id)
    ).resolves.toBeUndefined();
  });

  it('should search members by name or email', async () => {
    await seedMember(tenantA, 'Sara Ali');
    await seedMember(tenantA, 'Priya Nair');

    const { data } = await userAuditRepository.getUserAuditList({ ...rangeA, query: 'priya' });

    expect(data.map(({ name }) => name)).toEqual(['Priya Nair']);
  });

  it('should read sign-ins, end events, Session activity and live Sessions', async () => {
    const sara = await seedMember(tenantA, 'Sara Ali');
    const liveId = await seedSession(sara.id, tenantA, 5);
    await record(tenantA, sara.id, 'auth.sign-in', {
      entityId: liveId,
      sessionId: liveId,
      metadata: { rememberMe: true },
    });
    await record(tenantA, sara.id, 'patient.view', { sessionId: liveId });
    await record(tenantA, sara.id, 'visit.view', { sessionId: liveId });
    await record(tenantA, sara.id, 'auth.sign-out', { entityId: 'old-session' });
    await record(tenantA, 'admin-1', 'user.sessions-revoke', {
      entityId: sara.id,
      metadata: { sessionIds: ['older'] },
    });

    const signIns = await userAuditRepository.getSignIns(rangeA, sara.id, 10);
    const ends = await userAuditRepository.getSessionEndEvents(tenantA, sara.id, new Date(0));
    const activity = await userAuditRepository.getSessionActivity(tenantA, [liveId]);
    const live = await userAuditRepository.getLiveSessions(tenantA, sara.id);

    expect(signIns).toEqual([expect.objectContaining({ sessionId: liveId, rememberMe: true })]);
    expect(ends.map(({ action }) => action)).toEqual(['auth.sign-out', 'user.sessions-revoke']);
    expect(ends[1].sessionIds).toEqual(['older']);
    expect(activity).toEqual([expect.objectContaining({ sessionId: liveId, actionCount: 2 })]);
    expect(live.map(({ id }) => id)).toEqual([liveId]);
  });

  it('should break down failed attempts, IP addresses, devices and actions', async () => {
    const sara = await seedMember(tenantA, 'Sara Ali');
    await record(tenantA, sara.id, 'auth.sign-in-failed', { ipAddress: '1.1.1.1', userAgent: 'A' });
    await record(tenantA, sara.id, 'patient.view', { ipAddress: '1.1.1.1', userAgent: 'A' });
    await record(tenantA, sara.id, 'patient.view', { ipAddress: '2.2.2.2', userAgent: 'B' });

    const [failed, ips, devices, actions, distinct] = await Promise.all([
      userAuditRepository.getFailedSignIns(rangeA, sara.id, 10),
      userAuditRepository.getIpAddresses(rangeA, sara.id, 10),
      userAuditRepository.getDevices(rangeA, sara.id, 10),
      userAuditRepository.getActionCounts(rangeA, sara.id),
      userAuditRepository.countDistinctInRange(rangeA, sara.id),
    ]);

    expect(failed).toHaveLength(1);
    expect(ips.find(({ ipAddress }) => ipAddress === '1.1.1.1')?.eventCount).toBe(2);
    expect(devices).toHaveLength(2);
    expect(actions).toEqual(
      expect.arrayContaining([
        { action: 'patient.view', count: 2 },
        { action: 'auth.sign-in-failed', count: 1 },
      ])
    );
    expect(distinct).toEqual({ ipAddressCount: 2, deviceCount: 2 });
  });

  it('should read only the given Tenant’s data for a user who belongs to two Tenants', async () => {
    const sara = await seedMember(tenantA, 'Sara Ali');
    await seedOrganization(tenantB);
    await addOrganizationMember(tenantB, sara.id, 'member');
    const sessionA = await seedSession(sara.id, tenantA, 5);
    const sessionB = await seedSession(sara.id, tenantB, 5);

    await record(tenantA, sara.id, 'auth.sign-in', {
      entityId: sessionA,
      sessionId: sessionA,
      ipAddress: '10.0.0.1',
      userAgent: 'Agent A',
    });
    await record(tenantA, sara.id, 'auth.sign-in-failed', {
      ipAddress: '10.0.0.1',
      userAgent: 'Agent A',
    });
    await record(tenantA, sara.id, 'patient.view', {
      sessionId: sessionA,
      ipAddress: '10.0.0.1',
      userAgent: 'Agent A',
    });
    await record(tenantA, sara.id, 'auth.sign-out', { entityId: 'ended-a' });

    // The same user's trail in tenantB, on another IP address and device.
    const elsewhere = { ipAddress: '172.16.0.9', userAgent: 'Agent B' };
    await record(tenantB, sara.id, 'auth.sign-in', {
      entityId: sessionB,
      sessionId: sessionB,
      ...elsewhere,
    });
    await record(tenantB, sara.id, 'auth.sign-in-failed', elsewhere);
    await record(tenantB, sara.id, 'auth.sign-in-failed', elsewhere);
    await record(tenantB, sara.id, 'visit.view', { sessionId: sessionB, ...elsewhere });
    await record(tenantB, sara.id, 'visit.view', { sessionId: sessionA, ...elsewhere });
    await record(tenantB, sara.id, 'auth.session-revoke', { entityId: 'ended-b' });
    await record(tenantB, 'admin-b', 'user.sessions-revoke', {
      entityId: sara.id,
      metadata: { sessionIds: [sessionB] },
    });

    const [list, member, signIns, ends, activity, live, failed, ips, devices, actions, distinct] =
      await Promise.all([
        userAuditRepository.getUserAuditList(rangeA),
        userAuditRepository.getUserAuditMember(rangeA, sara.id),
        userAuditRepository.getSignIns(rangeA, sara.id, 10),
        userAuditRepository.getSessionEndEvents(tenantA, sara.id, new Date(0)),
        userAuditRepository.getSessionActivity(tenantA, [sessionA, sessionB]),
        userAuditRepository.getLiveSessions(tenantA, sara.id),
        userAuditRepository.getFailedSignIns(rangeA, sara.id, 10),
        userAuditRepository.getIpAddresses(rangeA, sara.id, 10),
        userAuditRepository.getDevices(rangeA, sara.id, 10),
        userAuditRepository.getActionCounts(rangeA, sara.id),
        userAuditRepository.countDistinctInRange(rangeA, sara.id),
      ]);

    const tenantAFigures = {
      signInCount: 1,
      failedSignInCount: 1,
      actionCount: 1,
      activeSessionCount: 1,
      lastSignInIp: '10.0.0.1',
      lastSignInUserAgent: 'Agent A',
    };
    expect(list.data).toEqual([expect.objectContaining(tenantAFigures)]);
    expect(member).toMatchObject(tenantAFigures);
    expect(signIns.map(({ sessionId }) => sessionId)).toEqual([sessionA]);
    expect(ends.map(({ entityId }) => entityId)).toEqual(['ended-a']);
    expect(activity).toEqual([expect.objectContaining({ sessionId: sessionA, actionCount: 1 })]);
    expect(live.map(({ id }) => id)).toEqual([sessionA]);
    expect(failed).toEqual([expect.objectContaining({ ipAddress: '10.0.0.1' })]);
    expect(ips).toEqual([expect.objectContaining({ ipAddress: '10.0.0.1', eventCount: 3 })]);
    expect(devices).toEqual([expect.objectContaining({ userAgent: 'Agent A', eventCount: 3 })]);
    expect(actions).toEqual(
      expect.arrayContaining([
        { action: 'auth.sign-in', count: 1 },
        { action: 'auth.sign-in-failed', count: 1 },
        { action: 'patient.view', count: 1 },
        { action: 'auth.sign-out', count: 1 },
      ])
    );
    expect(actions).toHaveLength(4);
    expect(distinct).toEqual({ ipAddressCount: 1, deviceCount: 1 });
  });
});
