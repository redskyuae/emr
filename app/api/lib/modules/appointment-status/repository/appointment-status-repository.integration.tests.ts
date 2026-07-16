import { describe, expect, it } from 'vitest';

import { appointmentStatusRepository } from './appointment-status-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createStatus = (tenantId: string, name: string, code: string) =>
  appointmentStatusRepository.createAppointmentStatus({
    tenantId,
    name,
    code,
    category: 'SCHEDULED',
    description: `${name} description`,
  });

describe('AppointmentStatus repository', () => {
  it('should create appointment status for a tenant', async () => {
    const created = await createStatus(tenantA, 'Scheduled', 'SCH');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Scheduled',
      code: 'SCH',
      description: 'Scheduled description',
    });
  });

  it('should get appointment status by id for same tenant', async () => {
    const created = await createStatus(tenantA, 'Confirmed', 'CNF');
    await expect(
      appointmentStatusRepository.getAppointmentStatusById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get appointment status by id for another tenant', async () => {
    const created = await createStatus(tenantA, 'Pending', 'PND');
    await expect(
      appointmentStatusRepository.getAppointmentStatusById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only appointment statuses for the requested tenant', async () => {
    await createStatus(tenantA, 'Completed', 'CMP');
    await createStatus(tenantB, 'Cancelled', 'CAN');
    const result = await appointmentStatusRepository.getAppointmentStatuses({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted appointment statuses', async () => {
    const deleted = await createStatus(tenantA, 'No Show', 'NOS');
    await appointmentStatusRepository.deleteAppointmentStatus(deleted.id, tenantA);
    await createStatus(tenantA, 'In Progress', 'PRG');
    const result = await appointmentStatusRepository.getAppointmentStatuses({ tenantId: tenantA });
    expect(result.data.map((s) => s.code)).toEqual(['PRG']);
  });

  it('should soft-delete appointment status and exclude it from future reads', async () => {
    const created = await createStatus(tenantA, 'Checked In', 'CHI');
    await expect(
      appointmentStatusRepository.deleteAppointmentStatus(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      appointmentStatusRepository.getAppointmentStatusById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it("should not delete another tenant's appointment status", async () => {
    const created = await createStatus(tenantA, 'On Hold', 'HLD');
    await expect(
      appointmentStatusRepository.deleteAppointmentStatus(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      appointmentStatusRepository.getAppointmentStatusById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should update only active appointment status for the requested tenant', async () => {
    const created = await createStatus(tenantA, 'Checked Out', 'CHO');
    await expect(
      appointmentStatusRepository.updateAppointmentStatus(created.id, {
        tenantId: tenantA,
        name: 'Discharged',
        code: 'DIS',
        category: 'COMPLETED',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Discharged', code: 'DIS' });
    await appointmentStatusRepository.deleteAppointmentStatus(created.id, tenantA);
    await expect(
      appointmentStatusRepository.updateAppointmentStatus(created.id, {
        tenantId: tenantA,
        name: 'Checked Out',
        code: 'CHO',
        category: 'COMPLETED',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's appointment status", async () => {
    const created = await createStatus(tenantA, 'Rescheduled', 'RES');
    await expect(
      appointmentStatusRepository.updateAppointmentStatus(created.id, {
        tenantId: tenantB,
        name: 'Moved',
        code: 'MOV',
        category: 'SCHEDULED',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createStatus(tenantA, 'Scheduled', 'SCH');
    await expect(createStatus(tenantA, 'scheduled', 'SCH2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_status_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createStatus(tenantA, 'Scheduled', 'SCH');
    await expect(createStatus(tenantA, 'Confirmed', 'sch')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_status_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createStatus(tenantA, 'Scheduled', 'SCH');
    await expect(createStatus(tenantB, 'Scheduled', 'SCH')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createStatus(tenantA, 'Scheduled', 'SCH');
    await appointmentStatusRepository.deleteAppointmentStatus(created.id, tenantA);
    await expect(createStatus(tenantA, 'scheduled', 'sch')).resolves.toMatchObject({
      name: 'scheduled',
      code: 'sch',
    });
  });

  it('should search by name and code', async () => {
    await createStatus(tenantA, 'Scheduled', 'SCH');
    await createStatus(tenantA, 'Confirmed', 'CNF');
    expect(
      (
        await appointmentStatusRepository.getAppointmentStatuses({
          tenantId: tenantA,
          query: 'conf',
        })
      ).data.map((s) => s.code)
    ).toEqual(['CNF']);
    expect(
      (
        await appointmentStatusRepository.getAppointmentStatuses({
          tenantId: tenantA,
          query: 'SCH',
        })
      ).data.map((s) => s.name)
    ).toEqual(['Scheduled']);
  });

  it('should paginate list results and return total', async () => {
    await createStatus(tenantA, 'Alpha', 'A');
    await createStatus(tenantA, 'Bravo', 'B');
    await createStatus(tenantA, 'Charlie', 'C');
    const result = await appointmentStatusRepository.getAppointmentStatuses({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((status) => status.name)).toEqual(['Charlie']);
  });
});
