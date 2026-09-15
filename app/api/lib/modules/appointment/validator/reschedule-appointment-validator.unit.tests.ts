import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';

import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import { validateRescheduleAppointment } from './reschedule-appointment-validator';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: {
    getAppointmentById: vi.fn(),
    getReservedSlotTimes: vi.fn(),
    getSlotBookingContext: vi.fn(),
  },
}));
vi.mock('../../appointment-status/repository/appointment-status-repository', () => ({
  appointmentStatusRepository: { findSystemByCategory: vi.fn() },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const repo = vi.mocked(appointmentRepository);
const statusRepo = vi.mocked(appointmentStatusRepository);
const tenantRepo = vi.mocked(tenantRepository);
const appointment = {
  id: 10,
  remarks: null,
  rotaName: null,
  doctorRotaId: null,
  cancelledAt: null,
  appointmentCancelledReason: null,
  tenantId: 'tenant-1',
  slotDate: '31-12-2099',
  startTime: '10:00',
  endTime: '11:00',
  bookingPath: 'PROCEDURE' as const,
  bookingNumber: 'APT-1001',
  createdOn: new Date(),
  doctor: null,
  patient: {
    id: 5,
    mrn: 'MRN-1001',
    phone: '9876543210',
    lastName: 'Rao',
    firstName: 'Asha',
    registrationStatus: 'registered' as const,
  },
  appointmentMode: null,
  appointmentType: null,
  appointmentReason: null,
  appointmentStatus: {
    id: 7,
    name: 'Scheduled',
    code: 'SCH',
    category: 'scheduled' as const,
  },
  slots: [],
};

describe('validateRescheduleAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getAppointmentById.mockResolvedValue(appointment);
    statusRepo.findSystemByCategory.mockResolvedValue({ id: 7 } as never);
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      timeZone: 'Asia/Kolkata',
    } as never);
  });

  it('should return schema errors without reading repositories', async () => {
    const result = await validateRescheduleAppointment('bad', {}, 'tenant-1');

    expect(result.success).toBe(false);
    expect(repo.getAppointmentById).not.toHaveBeenCalled();
  });

  it('should return not found when the Appointment does not exist for the Tenant', async () => {
    repo.getAppointmentById.mockResolvedValue(undefined);

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '11:00',
          endTime: '12:00',
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment 10 was not found.'],
    });
  });

  it('should reject an Appointment whose lifecycle has already progressed', async () => {
    repo.getAppointmentById.mockResolvedValue({
      ...appointment,
      appointmentStatus: { ...appointment.appointmentStatus, category: 'completed' },
    });

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '11:00',
          endTime: '12:00',
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be rescheduled.'],
    });
  });

  it('should reject changing the Booking Path', async () => {
    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'CONSULTATION',
          doctorId: 2,
          slotDate: '31-12-2099',
          doctorRotaId: 3,
          slotTimes: ['11:00'],
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment Booking Path cannot be changed when rescheduling.'],
    });
  });

  it('should reject an unchanged Procedure schedule', async () => {
    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '10:00',
          endTime: '11:00',
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      errors: ['The Appointment schedule has not changed.'],
    });
  });

  it('should return normalized Procedure reschedule data for a future changed schedule', async () => {
    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '11:00',
          endTime: '12:00',
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: true,
      data: {
        id: 10,
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
        bookingPath: 'PROCEDURE',
        slotDate: '2099-12-31',
        startTime: '11:00',
        endTime: '12:00',
      },
    });
  });

  it('should validate a changed Consultation schedule while excluding its own reservations', async () => {
    repo.getAppointmentById.mockResolvedValue({
      ...appointment,
      rotaName: 'Morning',
      doctorRotaId: 6,
      startTime: '09:00',
      endTime: '09:30',
      bookingPath: 'CONSULTATION',
      doctor: { id: 1, name: 'Dr. Meera' },
      slots: [
        { slotTime: '09:00', status: 'Booked' },
        { slotTime: '09:15', status: 'Booked' },
      ],
    });
    repo.getSlotBookingContext.mockResolvedValue({
      rotaName: 'Afternoon',
      doctorName: 'Dr. Iqbal',
      fromTime: '14:00',
      toTime: '15:00',
      durationMinutes: 15,
    });
    repo.getReservedSlotTimes.mockResolvedValue([]);

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'CONSULTATION',
          doctorId: 2,
          slotDate: '31-12-2099',
          doctorRotaId: 8,
          slotTimes: ['14:00', '14:15'],
        },
        'tenant-1'
      )
    ).resolves.toMatchObject({
      success: true,
      data: {
        id: 10,
        doctorId: 2,
        doctorRotaId: 8,
        slotDate: '2099-12-31',
        slotTimes: ['14:00', '14:15'],
      },
    });
    expect(repo.getReservedSlotTimes).toHaveBeenCalledWith(
      'tenant-1',
      2,
      '2099-12-31',
      ['14:00', '14:15'],
      { excludeAppointmentId: 10 }
    );
  });

  it('should reject an unchanged Consultation schedule', async () => {
    repo.getAppointmentById.mockResolvedValue({
      ...appointment,
      rotaName: 'Morning',
      doctorRotaId: 6,
      startTime: '09:00',
      endTime: '09:30',
      bookingPath: 'CONSULTATION',
      doctor: { id: 1, name: 'Dr. Meera' },
      slots: [
        { slotTime: '09:00', status: 'Booked' },
        { slotTime: '09:15', status: 'Booked' },
      ],
    });

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'CONSULTATION',
          doctorId: 1,
          slotDate: '31-12-2099',
          doctorRotaId: 6,
          slotTimes: ['09:00', '09:15'],
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      errors: ['The Appointment schedule has not changed.'],
    });
    expect(repo.getSlotBookingContext).not.toHaveBeenCalled();
  });

  it('should reject a Consultation slot reserved by another Appointment', async () => {
    repo.getAppointmentById.mockResolvedValue({
      ...appointment,
      rotaName: 'Morning',
      doctorRotaId: 6,
      bookingPath: 'CONSULTATION',
      doctor: { id: 1, name: 'Dr. Meera' },
    });
    repo.getSlotBookingContext.mockResolvedValue({
      rotaName: 'Afternoon',
      doctorName: 'Dr. Iqbal',
      fromTime: '14:00',
      toTime: '15:00',
      durationMinutes: 15,
    });
    repo.getReservedSlotTimes.mockResolvedValue([{ slotTime: '14:00' }]);

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'CONSULTATION',
          doctorId: 2,
          slotDate: '31-12-2099',
          doctorRotaId: 8,
          slotTimes: ['14:00'],
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it('should reject rescheduling when the system Scheduled status is missing', async () => {
    statusRepo.findSystemByCategory.mockResolvedValue(undefined);

    await expect(
      validateRescheduleAppointment(
        '10',
        {
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '11:00',
          endTime: '12:00',
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Scheduled appointment status is not configured.'],
    });
  });
});
