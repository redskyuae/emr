import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../repository/appointment-repository';
import { validateRescheduleAppointment } from '../validator/reschedule-appointment-validator';
import { rescheduleAppointmentCommand } from './reschedule-appointment-command';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { rescheduleAppointment: vi.fn() },
}));
vi.mock('../validator/reschedule-appointment-validator', () => ({
  validateRescheduleAppointment: vi.fn(),
}));

const repo = vi.mocked(appointmentRepository);
const validate = vi.mocked(validateRescheduleAppointment);

describe('rescheduleAppointmentCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return validation failure without writing', async () => {
    validate.mockResolvedValue({
      success: false,
      errors: ['Appointment cannot be rescheduled.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(rescheduleAppointmentCommand('10', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Appointment cannot be rescheduled.'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.rescheduleAppointment).not.toHaveBeenCalled();
  });

  it('should return the rescheduled Appointment on repository success', async () => {
    const data = {
      id: 10,
      tenantId: 'tenant-1',
      timeZone: 'Asia/Kolkata',
      bookingPath: 'PROCEDURE' as const,
      slotDate: '2099-12-31',
      startTime: '11:00',
      endTime: '12:00',
    };
    const updated = { id: 10, bookingNumber: 'APT-1001' } as never;
    validate.mockResolvedValue({ success: true, data });
    repo.rescheduleAppointment.mockResolvedValue({ success: true, data: updated });

    await expect(
      rescheduleAppointmentCommand('10', { bookingPath: 'PROCEDURE' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: updated });
    expect(repo.rescheduleAppointment).toHaveBeenCalledWith(data);
  });

  it('should map a concurrent slot conflict to a clean conflict response', async () => {
    validate.mockResolvedValue({
      success: true,
      data: {
        id: 10,
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
        bookingPath: 'CONSULTATION',
        doctorId: 2,
        slotDate: '2099-12-31',
        doctorRotaId: 8,
        slotTimes: ['14:00'],
      },
    });
    repo.rescheduleAppointment.mockResolvedValue({ success: false, outcome: 'slot-unavailable' });

    await expect(rescheduleAppointmentCommand('10', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it('should map the slot reservation unique constraint to a conflict response', async () => {
    validate.mockResolvedValue({
      success: true,
      data: {
        id: 10,
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
        bookingPath: 'CONSULTATION',
        doctorId: 2,
        slotDate: '2099-12-31',
        doctorRotaId: 8,
        slotTimes: ['14:00'],
      },
    });
    repo.rescheduleAppointment.mockRejectedValue({
      cause: {
        code: '23505',
        constraint: 'appointment_slot_reservation_active_doctor_slot_idx',
      },
    });

    await expect(rescheduleAppointmentCommand('10', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database unavailable');
    validate.mockResolvedValue({
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
    repo.rescheduleAppointment.mockRejectedValue(error);

    await expect(rescheduleAppointmentCommand('10', {}, 'tenant-1')).rejects.toThrow(error);
  });
});
