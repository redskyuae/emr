import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import { therapist as therapistTable } from '@/app/db/schema/therapist';
import { therapistScheduleRepository } from './therapist-schedule-repository';

let sequence = 0;

async function createTenantFixtures(tenantId: string) {
  sequence += 1;
  const userId = `${tenantId}-therapist-user-${sequence}`;
  await db.insert(organization).values({
    id: tenantId,
    name: `Hospital ${tenantId}`,
    slug: `hospital-${tenantId}-${sequence}`,
    createdAt: new Date(),
  });
  await db.insert(user).values({
    id: userId,
    name: 'Meera Nair',
    email: `${tenantId}-${sequence}@example.com`,
  });
  const [therapist] = await db
    .insert(therapistTable)
    .values({ tenantId, userId, isActive: true })
    .returning({ id: therapistTable.id });
  const [morningRota] = await db
    .insert(doctorRotaTable)
    .values({
      tenantId,
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '13:00',
      isActive: true,
    })
    .returning({ id: doctorRotaTable.id });
  const [eveningRota] = await db
    .insert(doctorRotaTable)
    .values({
      tenantId,
      name: 'Evening Rota',
      fromTime: '14:00',
      toTime: '18:00',
      isActive: true,
    })
    .returning({ id: doctorRotaTable.id });
  return {
    therapistId: therapist.id,
    morningRotaId: morningRota.id,
    eveningRotaId: eveningRota.id,
  };
}

describe('TherapistSchedule repository', () => {
  it('should create, read, list, and update a Therapist schedule with Rota details', async () => {
    const fixture = await createTenantFixtures('therapist-schedule-a');
    const created = await therapistScheduleRepository.createTherapistSchedule({
      tenantId: 'therapist-schedule-a',
      therapistId: fixture.therapistId,
      rotaIds: [fixture.morningRotaId],
      slotFromDate: '2026-09-24',
      slotToDate: '2026-09-30',
      slotDurationMinutes: 30,
    });
    expect(created).toMatchObject({
      therapistId: fixture.therapistId,
      slotInMinute: '00:30',
      rotaDetails: [{ rotaId: fixture.morningRotaId, rotaName: 'Morning Rota' }],
    });
    const updated = await therapistScheduleRepository.updateTherapistSchedule(created.id, {
      tenantId: 'therapist-schedule-a',
      rotaIds: [fixture.eveningRotaId],
      rotaType: 'new',
    });
    expect(updated?.rotaDetails.map(({ rotaName }) => rotaName)).toEqual([
      'Evening Rota',
      'Morning Rota',
    ]);
    await expect(
      therapistScheduleRepository.getTherapistSchedules({
        tenantId: 'therapist-schedule-a',
        therapistId: fixture.therapistId,
      })
    ).resolves.toMatchObject({ total: 1, data: [{ id: created.id }] });
  });

  it('should isolate Therapist schedules by Tenant', async () => {
    const fixture = await createTenantFixtures('therapist-schedule-b');
    await createTenantFixtures('therapist-schedule-c');
    const created = await therapistScheduleRepository.createTherapistSchedule({
      tenantId: 'therapist-schedule-b',
      therapistId: fixture.therapistId,
      rotaIds: [fixture.morningRotaId],
      slotFromDate: '2026-09-24',
      slotToDate: '2026-09-30',
      slotDurationMinutes: 30,
    });
    await expect(
      therapistScheduleRepository.getTherapistScheduleById(created.id, 'therapist-schedule-c')
    ).resolves.toBeUndefined();
  });

  it('should reject overlapping schedules for one Therapist transactionally', async () => {
    const fixture = await createTenantFixtures('therapist-schedule-d');
    await therapistScheduleRepository.createTherapistSchedule({
      tenantId: 'therapist-schedule-d',
      therapistId: fixture.therapistId,
      rotaIds: [fixture.morningRotaId],
      slotFromDate: '2026-09-24',
      slotToDate: '2026-09-30',
      slotDurationMinutes: 30,
    });
    await expect(
      therapistScheduleRepository.createTherapistSchedule({
        tenantId: 'therapist-schedule-d',
        therapistId: fixture.therapistId,
        rotaIds: [fixture.eveningRotaId],
        slotFromDate: '2026-09-30',
        slotToDate: '2026-10-02',
        slotDurationMinutes: 30,
      })
    ).rejects.toThrow('Therapist schedule overlaps with an existing schedule.');
  });
});
