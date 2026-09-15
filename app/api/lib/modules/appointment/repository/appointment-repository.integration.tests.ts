import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentCancelledReason as appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
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
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { visitRepository } from '../../visit/repository/visit-repository';
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
  const [confirmedStatus] = await db
    .insert(appointmentStatusTable)
    .values({
      tenantId,
      name: 'Confirmed',
      code: 'CNF',
      category: 'CONFIRMED',
      isSystem: true,
    })
    .returning({ id: appointmentStatusTable.id });
  await db.insert(appointmentStatusTable).values({
    tenantId,
    name: 'Checked In',
    code: 'CHK',
    category: 'CHECKED_IN',
    isSystem: true,
  });
  await db.insert(appointmentStatusTable).values({
    tenantId,
    name: 'Cancelled',
    code: 'CAN',
    category: 'CANCELLED',
    isSystem: true,
  });
  const [cancellationReason] = await db
    .insert(appointmentCancelledReasonTable)
    .values({
      tenantId,
      name: 'Patient Request',
      code: 'PATR',
      description: 'Cancelled at the Patient request',
    })
    .returning({ id: appointmentCancelledReasonTable.id });
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: 'Outpatient', code: 'OPD' })
    .returning({ id: visitTypeTable.id });
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

  return {
    tenantId,
    doctorId: doctor.id,
    rotaId: rota.id,
    mode,
    type,
    reason,
    visitType,
    confirmedStatus,
    cancellationReason,
    patient,
  };
}

function appointmentData(
  fixtures: Awaited<ReturnType<typeof createFixtures>>,
  overrides: Partial<Extract<ValidatedCreateAppointmentData, { bookingPath: 'CONSULTATION' }>> = {}
): Extract<ValidatedCreateAppointmentData, { bookingPath: 'CONSULTATION' }> {
  return {
    bookingPath: 'CONSULTATION',
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
  it('should cancel an Appointment, release slots, and retain its historical reason', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    const result = await appointmentRepository.cancelAppointment({
      id: created.data.id,
      tenantId: fixtures.tenantId,
      appointmentCancelledReasonId: fixtures.cancellationReason.id,
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        id: created.data.id,
        bookingNumber: created.data.bookingNumber,
        cancelledAt: expect.any(Date),
        appointmentStatus: { category: 'cancelled' },
        appointmentCancelledReason: {
          id: fixtures.cancellationReason.id,
          name: 'Patient Request',
          code: 'PATR',
        },
        slots: [],
      },
    });
    await expect(
      appointmentRepository.getReservedSlotTimes(
        fixtures.tenantId,
        fixtures.doctorId,
        '2099-12-31',
        ['09:00', '09:15']
      )
    ).resolves.toEqual([]);

    await db
      .update(appointmentCancelledReasonTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(appointmentCancelledReasonTable.id, fixtures.cancellationReason.id));
    await expect(
      appointmentRepository.getAppointmentById(created.data.id, fixtures.tenantId)
    ).resolves.toMatchObject({
      appointmentCancelledReason: { name: 'Patient Request' },
    });
    await expect(
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: fixtures.tenantId,
        appointmentCancelledReasonId: fixtures.cancellationReason.id,
      })
    ).resolves.toEqual({ success: false, outcome: 'ineligible' });
  });

  it('should not cancel an Appointment belonging to another Tenant', async () => {
    const fixtures = await createFixtures();
    const other = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    await expect(
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: other.tenantId,
        appointmentCancelledReasonId: other.cancellationReason.id,
      })
    ).resolves.toEqual({ success: false, outcome: 'not-found' });
  });

  it('should cancel a Confirmed Appointment', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    await db
      .update(appointmentTable)
      .set({ appointmentStatusId: fixtures.confirmedStatus.id })
      .where(eq(appointmentTable.id, created.data.id));

    await expect(
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: fixtures.tenantId,
        appointmentCancelledReasonId: fixtures.cancellationReason.id,
      })
    ).resolves.toMatchObject({
      success: true,
      data: { appointmentStatus: { category: 'cancelled' } },
    });
  });

  it('should preserve the Appointment and reservations when the reason belongs to another Tenant', async () => {
    const fixtures = await createFixtures();
    const other = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    await expect(
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: fixtures.tenantId,
        appointmentCancelledReasonId: other.cancellationReason.id,
      })
    ).resolves.toEqual({ success: false, outcome: 'invalid-reason' });

    await expect(
      appointmentRepository.getAppointmentById(created.data.id, fixtures.tenantId)
    ).resolves.toMatchObject({
      cancelledAt: null,
      appointmentCancelledReason: null,
      appointmentStatus: { category: 'scheduled' },
      slots: [{ slotTime: '09:00' }, { slotTime: '09:15' }],
    });
  });

  it('should preserve the Appointment and reservations when its cancellation reason was deleted', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    await db
      .update(appointmentCancelledReasonTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(appointmentCancelledReasonTable.id, fixtures.cancellationReason.id));

    await expect(
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: fixtures.tenantId,
        appointmentCancelledReasonId: fixtures.cancellationReason.id,
      })
    ).resolves.toEqual({ success: false, outcome: 'invalid-reason' });

    await expect(
      appointmentRepository.getAppointmentById(created.data.id, fixtures.tenantId)
    ).resolves.toMatchObject({
      cancelledAt: null,
      appointmentCancelledReason: null,
      appointmentStatus: { category: 'scheduled' },
      slots: [{ slotTime: '09:00' }, { slotTime: '09:15' }],
    });
  });

  it('should allow exactly one of cancellation and Check-in to commit', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    const [cancellation, checkIn] = await Promise.all([
      appointmentRepository.cancelAppointment({
        id: created.data.id,
        tenantId: fixtures.tenantId,
        appointmentCancelledReasonId: fixtures.cancellationReason.id,
      }),
      visitRepository.checkInVisit({
        tenantId: fixtures.tenantId,
        appointmentId: created.data.id,
        patientId: fixtures.patient.id,
        doctorId: fixtures.doctorId,
        visitTypeId: fixtures.visitType.id,
        visitDate: '2099-12-31',
      }),
    ]);

    expect(Number(cancellation.success) + Number(checkIn.success)).toBe(1);

    const appointment = await appointmentRepository.getAppointmentById(
      created.data.id,
      fixtures.tenantId
    );

    if (cancellation.success) {
      expect(checkIn).toEqual({ success: false, outcome: 'appointment-ineligible' });
      expect(appointment).toMatchObject({
        cancelledAt: expect.any(Date),
        appointmentStatus: { category: 'cancelled' },
      });
    } else {
      expect(cancellation).toEqual({ success: false, outcome: 'ineligible' });
      expect(checkIn).toMatchObject({ success: true });
      expect(appointment).toMatchObject({
        cancelledAt: null,
        appointmentStatus: { category: 'checked_in' },
      });
    }
  });

  it('should reschedule a Consultation while preserving its identity and releasing old slots', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    const result = await appointmentRepository.rescheduleAppointment({
      id: created.data.id,
      tenantId: fixtures.tenantId,
      timeZone: 'Asia/Kolkata',
      bookingPath: 'CONSULTATION',
      doctorId: fixtures.doctorId,
      slotDate: '2099-12-31',
      doctorRotaId: fixtures.rotaId,
      slotTimes: ['09:30', '09:45'],
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        id: created.data.id,
        bookingNumber: created.data.bookingNumber,
        doctorRotaId: fixtures.rotaId,
        startTime: '09:30',
        endTime: '10:00',
        appointmentStatus: { category: 'scheduled' },
        slots: [
          { slotTime: '09:30', status: 'Booked' },
          { slotTime: '09:45', status: 'Booked' },
        ],
      },
    });
    await expect(
      appointmentRepository.getReservedSlotTimes(
        fixtures.tenantId,
        fixtures.doctorId,
        '2099-12-31',
        ['09:00', '09:15']
      )
    ).resolves.toEqual([]);
  });

  it('should reschedule a Procedure without changing its Doctor assignment', async () => {
    const fixtures = await createFixtures();
    const created = await appointmentRepository.createAppointment({
      tenantId: fixtures.tenantId,
      timeZone: 'Asia/Kolkata',
      bookingPath: 'PROCEDURE',
      patientId: fixtures.patient.id,
      doctorId: fixtures.doctorId,
      slotDate: '2099-12-31',
      startTime: '10:00',
      endTime: '11:00',
      remarks: undefined,
    });
    if (!created.success) throw new Error('appointment creation failed');

    const result = await appointmentRepository.rescheduleAppointment({
      id: created.data.id,
      tenantId: fixtures.tenantId,
      timeZone: 'Asia/Kolkata',
      bookingPath: 'PROCEDURE',
      slotDate: '2099-12-31',
      startTime: '12:00',
      endTime: '13:15',
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        id: created.data.id,
        bookingNumber: created.data.bookingNumber,
        doctor: { id: fixtures.doctorId },
        startTime: '12:00',
        endTime: '13:15',
        slots: [],
      },
    });
  });

  it('should not reschedule an Appointment belonging to another Tenant', async () => {
    const fixtures = await createFixtures();
    const other = await createFixtures();
    const created = await appointmentRepository.createAppointment(appointmentData(fixtures));
    if (!created.success) throw new Error('appointment creation failed');

    await expect(
      appointmentRepository.rescheduleAppointment({
        id: created.data.id,
        tenantId: other.tenantId,
        timeZone: 'Asia/Kolkata',
        bookingPath: 'CONSULTATION',
        doctorId: other.doctorId,
        slotDate: '2099-12-31',
        doctorRotaId: other.rotaId,
        slotTimes: ['09:30'],
      })
    ).resolves.toEqual({ success: false, outcome: 'not-found' });
  });

  it('should create an appointment for an existing patient with consecutive slots', async () => {
    const fixtures = await createFixtures();

    const result = await appointmentRepository.createAppointment(appointmentData(fixtures));

    expect(result).toMatchObject({
      success: true,
      data: {
        bookingNumber: 'APT-1001',
        doctorRotaId: fixtures.rotaId,
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

  it('should create a Procedure with Doctor N/A without reserving Doctor slots', async () => {
    const fixtures = await createFixtures();

    const result = await appointmentRepository.createAppointment({
      tenantId: fixtures.tenantId,
      timeZone: 'Asia/Kolkata',
      bookingPath: 'PROCEDURE',
      patientId: fixtures.patient.id,
      slotDate: '2099-12-31',
      startTime: '10:00',
      endTime: '11:15',
      remarks: undefined,
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        bookingPath: 'PROCEDURE',
        doctor: null,
        rotaName: null,
        startTime: '10:00',
        endTime: '11:15',
        appointmentMode: null,
        appointmentType: null,
        appointmentReason: null,
        slots: [],
      },
    });
  });

  it('should assign a Procedure Doctor without using a DoctorRota or reserving Doctor slots', async () => {
    const fixtures = await createFixtures();

    const result = await appointmentRepository.createAppointment({
      tenantId: fixtures.tenantId,
      timeZone: 'Asia/Kolkata',
      bookingPath: 'PROCEDURE',
      patientId: fixtures.patient.id,
      doctorId: fixtures.doctorId,
      slotDate: '2099-12-31',
      startTime: '12:00',
      endTime: '13:00',
      remarks: undefined,
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        bookingPath: 'PROCEDURE',
        doctor: { id: fixtures.doctorId },
        rotaName: null,
        startTime: '12:00',
        endTime: '13:00',
        slots: [],
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
