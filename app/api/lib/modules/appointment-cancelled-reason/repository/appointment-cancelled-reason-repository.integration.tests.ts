import { describe, expect, it } from 'vitest';

import { appointmentCancelledReasonRepository } from './appointment-cancelled-reason-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createCancelledReason = (tenantId: string, name: string, code: string) =>
  appointmentCancelledReasonRepository.createAppointmentCancelledReason({
    tenantId,
    name,
    code,
    description: `${name} description`,
  });

describe('AppointmentCancelledReason repository', () => {
  it('should create appointment cancelled reason for a tenant', async () => {
    const created = await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Patient Cancelled',
      code: 'PAT',
      description: 'Patient Cancelled description',
    });
  });

  it('should get appointment cancelled reason by id for same tenant', async () => {
    const created = await createCancelledReason(tenantA, 'Doctor Cancelled', 'DOC');
    await expect(
      appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get appointment cancelled reason by id for another tenant', async () => {
    const created = await createCancelledReason(tenantA, 'Emergency', 'EMG');
    await expect(
      appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only appointment cancelled reasons for the requested tenant', async () => {
    await createCancelledReason(tenantA, 'No Show', 'NOS');
    await createCancelledReason(tenantB, 'Rescheduled', 'RES');
    const result = await appointmentCancelledReasonRepository.getAppointmentCancelledReasons({
      tenantId: tenantA,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted appointment cancelled reasons', async () => {
    const deleted = await createCancelledReason(tenantA, 'Double Booked', 'DBL');
    await appointmentCancelledReasonRepository.deleteAppointmentCancelledReason(
      deleted.id,
      tenantA
    );
    await createCancelledReason(tenantA, 'System Error', 'SYS');
    const result = await appointmentCancelledReasonRepository.getAppointmentCancelledReasons({
      tenantId: tenantA,
    });
    expect(result.data.map((r) => r.code)).toEqual(['SYS']);
  });

  it('should soft-delete appointment cancelled reason and exclude it from future reads', async () => {
    const created = await createCancelledReason(tenantA, 'Late Arrival', 'LATE');
    await expect(
      appointmentCancelledReasonRepository.deleteAppointmentCancelledReason(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      appointmentCancelledReasonRepository.getAppointmentCancelledReasonById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active appointment cancelled reason for the requested tenant', async () => {
    const created = await createCancelledReason(tenantA, 'Insurance Issue', 'INS');
    await expect(
      appointmentCancelledReasonRepository.updateAppointmentCancelledReason(created.id, {
        tenantId: tenantA,
        name: 'Coverage Problem',
        code: 'COV',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Coverage Problem', code: 'COV' });
    await appointmentCancelledReasonRepository.deleteAppointmentCancelledReason(
      created.id,
      tenantA
    );
    await expect(
      appointmentCancelledReasonRepository.updateAppointmentCancelledReason(created.id, {
        tenantId: tenantA,
        name: 'Insurance Issue',
        code: 'INS',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's appointment cancelled reason", async () => {
    const created = await createCancelledReason(tenantA, 'Weather', 'WTH');
    await expect(
      appointmentCancelledReasonRepository.updateAppointmentCancelledReason(created.id, {
        tenantId: tenantB,
        name: 'Bad Weather',
        code: 'BAD',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    await expect(createCancelledReason(tenantA, 'patient cancelled', 'PAT2')).rejects.toMatchObject(
      {
        cause: { code: '23505', constraint: 'appointment_cancelled_reason_tenant_name_idx' },
      }
    );
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    await expect(createCancelledReason(tenantA, 'Doctor Cancelled', 'pat')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_cancelled_reason_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    await expect(createCancelledReason(tenantB, 'Patient Cancelled', 'PAT')).resolves.toMatchObject(
      {
        tenantId: tenantB,
      }
    );
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    await appointmentCancelledReasonRepository.deleteAppointmentCancelledReason(
      created.id,
      tenantA
    );
    await expect(createCancelledReason(tenantA, 'patient cancelled', 'pat')).resolves.toMatchObject(
      {
        name: 'patient cancelled',
        code: 'pat',
      }
    );
  });

  it('should search by name and code', async () => {
    await createCancelledReason(tenantA, 'Patient Cancelled', 'PAT');
    await createCancelledReason(tenantA, 'Doctor Cancelled', 'DOC');
    expect(
      (
        await appointmentCancelledReasonRepository.getAppointmentCancelledReasons({
          tenantId: tenantA,
          query: 'doc',
        })
      ).data.map((r) => r.code)
    ).toEqual(['DOC']);
    expect(
      (
        await appointmentCancelledReasonRepository.getAppointmentCancelledReasons({
          tenantId: tenantA,
          query: 'PAT',
        })
      ).data.map((r) => r.name)
    ).toEqual(['Patient Cancelled']);
  });

  it('should paginate list results and return total', async () => {
    await createCancelledReason(tenantA, 'Alpha', 'A');
    await createCancelledReason(tenantA, 'Bravo', 'B');
    await createCancelledReason(tenantA, 'Charlie', 'C');
    const result = await appointmentCancelledReasonRepository.getAppointmentCancelledReasons({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((reason) => reason.name)).toEqual(['Charlie']);
  });
});
