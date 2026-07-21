import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import {
  doctorSchedule as doctorScheduleTable,
  doctorScheduleRota as doctorScheduleRotaTable,
} from '@/app/db/schema/doctor-schedule';
import { patient as patientTable } from '@/app/db/schema/patient';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import type { ValidatedCreateAppointmentData } from '../schemas/appointment-schema';
import { appointmentRepository } from './appointment-repository';

let sequence = 0;

async function createFixtures() {
  sequence += 1;
  const tenantId = `appointment-tenant-${sequence}`;
  const doctorUserId = `${tenantId}-doctor-user`;

  await db.insert(organization).values({
    id: tenantId,
    name: `Appointment Hospital ${sequence}`,
    slug: `appointment-hospital-${sequence}`,
    createdAt: new Date(),
    metadata: JSON.stringify({ isActive: true, timeZone: 'Asia/Kolkata' }),
  });
  await db.insert(user).values({
    id: doctorUserId,
    name: 'Dr. Meera Iyer',
    email: `${doctorUserId}@example.com`,
  });

  const [specialty] = await db
    .insert(specialtyTable)
    .values({ tenantId, name: 'Cardiology', code: `CARD${sequence}` })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({
      tenantId,
      userId: doctorUserId,
      specialtyId: specialty.id,
      registrationNumber: `REG-${sequence}`,
      isActive: true,
    })
    .returning({ id: doctorTable.id });
  const [rota] = await db
    .insert(doctorRotaTable)
    .values({
      tenantId,
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '10:00',
      isActive: true,
    })
    .returning({ id: doctorRotaTable.id });
  const [schedule] = await db
    .insert(doctorScheduleTable)
    .values({
      tenantId,
      doctorId: doctor.id,
      slotFromDate: '2099-12-31',
      slotToDate: '2099-12-31',
      slotDurationMinutes: 15,
      isActive: true,
    })
    .returning({ id: doctorScheduleTable.id });
  await db.insert(doctorScheduleRotaTable).values({
    tenantId,
    doctorScheduleId: schedule.id,
    doctorRotaId: rota.id,
  });

  const [mode] = await db
    .insert(appointmentModeTable)
    .values({ tenantId, name: 'In-person', code: 'INP' })
    .returning({ id: appointmentModeTable.id });
  const [type] = await db
    .insert(appointmentTypeTable)
    .values({ tenantId, name: 'Consultation', code: 'CONS' })
    .returning({ id: appointmentTypeTable.id });
  const [reason] = await db
    .insert(appointmentReasonTable)
    .values({ tenantId, name: 'Follow-up', code: 'FUP' })
    .returning({ id: appointmentReasonTable.id });
  await db.insert(appointmentStatusTable).values({
    tenantId,
    name: 'Scheduled',
    code: 'SCH',
    category: 'SCHEDULED',
    isSystem: true,
  });
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${sequence}`,
      firstName: 'Asha',
      lastName: 'Rao',
      gender: 'female',
      dateOfBirth: '1990-05-14',
      phone: `98765432${String(sequence).padStart(2, '0')}`,
      registrationStatus: 'registered',
      isActive: true,
    })
    .returning({ id: patientTable.id, phone: patientTable.phone });

  return { tenantId, doctorId: doctor.id, rotaId: rota.id, mode, type, reason, patient };
}

function appointmentData(
  fixtures: Awaited<ReturnType<typeof createFixtures>>,
  overrides: Partial<ValidatedCreateAppointmentData> = {}
): ValidatedCreateAppointmentData {
  return {
    tenantId: fixtures.tenantId,
    timeZone: 'Asia/Kolkata',
    doctorId: fixtures.doctorId,
    appointmentModeId: fixtures.mode.id,
    appointmentTypeId: fixtures.type.id,
    appointmentReasonId: fixtures.reason.id,
    patientId: fixtures.patient.id,
    slotDate: '2099-12-31',
    doctorRotaId: fixtures.rotaId,
    slotTimes: ['09:00', '09:15'],
    remarks: undefined,
    ...overrides,
  };
}

describe('Appointment repository', () => {
  it('should create an appointment for an existing patient with consecutive slots', async () => {
    const fixtures = await createFixtures();

    const result = await appointmentRepository.createAppointment(appointmentData(fixtures));

    expect(result).toMatchObject({
      success: true,
      data: {
        bookingNumber: 'APT-1001',
        slotDate: '31-12-2099',
        rotaName: 'Morning Rota',
        patient: { id: fixtures.patient.id, registrationStatus: 'registered' },
        doctor: { id: fixtures.doctorId, name: 'Dr. Meera Iyer' },
        appointmentStatus: { category: 'scheduled' },
        slots: [
          { slotTime: '09:00', status: 'Booked' },
          { slotTime: '09:15', status: 'Booked' },
        ],
      },
    });
  });

  it('should reject booking a slot already reserved for the doctor', async () => {
    const fixtures = await createFixtures();
    await appointmentRepository.createAppointment(appointmentData(fixtures));

    await expect(
      appointmentRepository.createAppointment(
        appointmentData(fixtures, { slotTimes: ['09:00'], remarks: 'Second attempt' })
      )
    ).resolves.toEqual({ success: false, outcome: 'slot-unavailable' });
  });

  it('should create a provisional patient when patientId is absent', async () => {
    const fixtures = await createFixtures();

    const result = await appointmentRepository.createAppointment(
      appointmentData(fixtures, {
        patientId: undefined,
        provisionalPatient: {
          firstName: 'Priya',
          lastName: 'Menon',
          phone: '9000000001',
        },
        slotTimes: ['09:30'],
      })
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        patient: {
          mrn: 'MRN-1001',
          firstName: 'Priya',
          lastName: 'Menon',
          phone: '9000000001',
          registrationStatus: 'provisional',
        },
      },
    });
  });

  it('should return potential matches instead of auto-linking provisional patient details', async () => {
    const fixtures = await createFixtures();

    await expect(
      appointmentRepository.createAppointment(
        appointmentData(fixtures, {
          patientId: undefined,
          provisionalPatient: {
            firstName: ' Asha ',
            lastName: ' Rao ',
            phone: fixtures.patient.phone,
          },
        })
      )
    ).resolves.toMatchObject({
      success: false,
      outcome: 'potential-patient-match',
      patientMatches: [{ id: fixtures.patient.id, firstName: 'Asha', lastName: 'Rao' }],
    });
  });

  describe('getAppointmentByBookingNumber', () => {
    it('should find an appointment by its booking number case-insensitively', async () => {
      const fixtures = await createFixtures();
      const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
      if (!created.success) throw new Error('appointment creation failed');

      await expect(
        appointmentRepository.getAppointmentByBookingNumber(
          created.data.bookingNumber.toLowerCase(),
          fixtures.tenantId
        )
      ).resolves.toMatchObject({ id: created.data.id, bookingNumber: created.data.bookingNumber });
    });

    it('should trim surrounding whitespace from the booking number', async () => {
      const fixtures = await createFixtures();
      const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
      if (!created.success) throw new Error('appointment creation failed');

      await expect(
        appointmentRepository.getAppointmentByBookingNumber(
          `  ${created.data.bookingNumber}  `,
          fixtures.tenantId
        )
      ).resolves.toMatchObject({ id: created.data.id });
    });

    it('should not find an appointment belonging to another tenant', async () => {
      const fixtures = await createFixtures();
      const other = await createFixtures();
      const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
      if (!created.success) throw new Error('appointment creation failed');

      await expect(
        appointmentRepository.getAppointmentByBookingNumber(
          created.data.bookingNumber,
          other.tenantId
        )
      ).resolves.toBeUndefined();
    });

    it('should return undefined for an unknown booking number', async () => {
      const fixtures = await createFixtures();

      await expect(
        appointmentRepository.getAppointmentByBookingNumber('APT-9999', fixtures.tenantId)
      ).resolves.toBeUndefined();
    });
  });

  describe('getAppointments', () => {
    it('should list Appointments for one tenant ordered by earliest slot time on a date', async () => {
      const fixtures = await createFixtures();
      const later = await appointmentRepository.createAppointment(
        appointmentData(fixtures, { slotTimes: ['09:30'], remarks: 'Later slot' })
      );
      const earlier = await appointmentRepository.createAppointment(
        appointmentData(fixtures, { slotTimes: ['09:00'], remarks: 'Earlier slot' })
      );
      if (!later.success || !earlier.success) throw new Error('appointment creation failed');

      const result = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        slotDate: '2099-12-31',
      });

      expect(result).toMatchObject({
        total: 2,
        data: [
          { id: earlier.data.id, slotDate: '31-12-2099', slots: [{ slotTime: '09:00' }] },
          { id: later.data.id, slotDate: '31-12-2099', slots: [{ slotTime: '09:30' }] },
        ],
      });
    });

    it('should filter Appointments by doctor, patient, status, and search text', async () => {
      const fixtures = await createFixtures();
      const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
      if (!created.success) throw new Error('appointment creation failed');

      const byDoctor = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        doctorId: fixtures.doctorId,
      });
      const byPatient = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        patientId: fixtures.patient.id,
      });
      const byStatus = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        appointmentStatusId: created.data.appointmentStatus.id,
      });
      const byBookingNumber = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        query: created.data.bookingNumber.toLowerCase(),
      });
      const byPatientName = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        query: 'asha',
      });
      const noMatch = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        query: 'nobody',
      });

      expect(byDoctor.total).toBe(1);
      expect(byPatient.total).toBe(1);
      expect(byStatus.total).toBe(1);
      expect(byBookingNumber.total).toBe(1);
      expect(byPatientName.total).toBe(1);
      expect(noMatch).toMatchObject({ total: 0, data: [] });
    });

    it('should not list Appointments belonging to another tenant', async () => {
      const fixtures = await createFixtures();
      const other = await createFixtures();
      await appointmentRepository.createAppointment(appointmentData(fixtures));

      await expect(
        appointmentRepository.getAppointments({ tenantId: other.tenantId })
      ).resolves.toMatchObject({ total: 0, data: [] });
    });

    it('should paginate Appointments', async () => {
      const fixtures = await createFixtures();
      await appointmentRepository.createAppointment(
        appointmentData(fixtures, { slotTimes: ['09:00'] })
      );
      await appointmentRepository.createAppointment(
        appointmentData(fixtures, { slotTimes: ['09:15'] })
      );

      const page = await appointmentRepository.getAppointments({
        tenantId: fixtures.tenantId,
        slotDate: '2099-12-31',
        page: 2,
        limit: 1,
      });

      expect(page.total).toBe(2);
      expect(page.data).toHaveLength(1);
      expect(page.data[0]?.slots[0]?.slotTime).toBe('09:15');
    });
  });
});
