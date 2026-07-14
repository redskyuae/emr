import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { doctorScheduleRepository } from './doctor-schedule-repository';

let sequence = 0;

async function createTenantFixtures(tenantId: string) {
  sequence += 1;
  await db.insert(organization).values({
    id: tenantId,
    name: `Hospital ${tenantId}`,
    slug: `hospital-${tenantId}-${sequence}`,
    createdAt: new Date(),
  });
  await db.insert(user).values({
    id: `${tenantId}-doctor-user`,
    name: 'Anita Mehta',
    email: `${tenantId}-${sequence}@example.com`,
  });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: 'Cardiology', code: 'CARD', tenantId })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({
      tenantId,
      userId: `${tenantId}-doctor-user`,
      specialtyId: specialty.id,
      isActive: true,
    })
    .returning({ id: doctorTable.id });
  const [morningRota] = await db
    .insert(doctorRotaTable)
    .values({
      tenantId,
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '10:00',
      isActive: true,
    })
    .returning({ id: doctorRotaTable.id });
  const [eveningRota] = await db
    .insert(doctorRotaTable)
    .values({
      tenantId,
      name: 'Evening Rota',
      fromTime: '17:00',
      toTime: '18:00',
      isActive: true,
    })
    .returning({ id: doctorRotaTable.id });

  return { doctorId: doctor.id, morningRotaId: morningRota.id, eveningRotaId: eveningRota.id };
}

describe('DoctorSchedule repository', () => {
  it('should create and read a doctor schedule with rota details', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.morningRotaId],
      slotToDate: '2026-07-20',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });

    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      slotInMinute: '00:15',
      rotaDetails: [{ rotaId: fixtures.morningRotaId, rotaName: 'Morning Rota' }],
    });
    await expect(
      doctorScheduleRepository.getDoctorScheduleById(created.id, 'tenant-a')
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should isolate schedules by tenant', async () => {
    const tenantA = await createTenantFixtures('tenant-a');
    await createTenantFixtures('tenant-b');
    const created = await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: tenantA.doctorId,
      rotaIds: [tenantA.morningRotaId],
      slotToDate: '2026-07-20',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });

    await expect(
      doctorScheduleRepository.getDoctorScheduleById(created.id, 'tenant-b')
    ).resolves.toBeUndefined();
    await expect(
      doctorScheduleRepository.getDoctorSchedules({ tenantId: 'tenant-b' })
    ).resolves.toMatchObject({ data: [], total: 0 });
  });

  it('should list schedules with pagination and doctor filter', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.morningRotaId],
      slotToDate: '2026-07-15',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });
    await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.eveningRotaId],
      slotToDate: '2026-07-16',
      slotFromDate: '2026-07-16',
      slotDurationMinutes: 30,
    });

    const result = await doctorScheduleRepository.getDoctorSchedules({
      page: 2,
      limit: 1,
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
    });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.slotFromDate).toBe('2026-07-16');
  });

  it('should add and remove rota links on update', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.morningRotaId],
      slotToDate: '2026-07-15',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });

    await expect(
      doctorScheduleRepository.updateDoctorSchedule(created.id, {
        tenantId: 'tenant-a',
        rotaIds: [fixtures.eveningRotaId],
        rotaType: 'new',
      })
    ).resolves.toMatchObject({
      rotaDetails: expect.arrayContaining([{ rotaName: 'Evening Rota' }]),
    });
    await expect(
      doctorScheduleRepository.updateDoctorSchedule(created.id, {
        tenantId: 'tenant-a',
        rotaIds: [fixtures.morningRotaId],
        rotaType: 'remove',
      })
    ).resolves.toMatchObject({ rotaDetails: [{ rotaName: 'Evening Rota' }] });
  });

  it('should generate available slots from assigned rotas', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.morningRotaId],
      slotToDate: '2026-07-15',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });

    await expect(
      doctorScheduleRepository.getDoctorSlots('tenant-a', fixtures.doctorId, '2026-07-15')
    ).resolves.toEqual([
      {
        slotDate: '2026-07-15',
        status: 'Available',
        rotas: [
          {
            duration: 15,
            doctorRotaId: fixtures.morningRotaId,
            rotaName: 'Morning Rota',
            slots: [
              { slot: 1, slotTime: '09:00', slotStatus: 'Available' },
              { slot: 2, slotTime: '09:15', slotStatus: 'Available' },
              { slot: 3, slotTime: '09:30', slotStatus: 'Available' },
              { slot: 4, slotTime: '09:45', slotStatus: 'Available' },
            ],
          },
        ],
      },
    ]);
  });

  it('should detect overlapping schedules for the same doctor and tenant', async () => {
    const fixtures = await createTenantFixtures('tenant-a');
    const created = await doctorScheduleRepository.createDoctorSchedule({
      tenantId: 'tenant-a',
      doctorId: fixtures.doctorId,
      rotaIds: [fixtures.morningRotaId],
      slotToDate: '2026-07-20',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });

    await expect(
      doctorScheduleRepository.hasOverlappingSchedule(
        'tenant-a',
        fixtures.doctorId,
        '2026-07-18',
        '2026-07-25'
      )
    ).resolves.toBe(true);
    await expect(
      doctorScheduleRepository.hasOverlappingSchedule(
        'tenant-a',
        fixtures.doctorId,
        '2026-07-18',
        '2026-07-25',
        { excludeId: created.id }
      )
    ).resolves.toBe(false);
  });
});
