import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../repository/appointment-repository';
import { validateCancelAppointment } from '../validator/cancel-appointment-validator';
import { cancelAppointmentCommand } from './cancel-appointment-command';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { cancelAppointment: vi.fn() },
}));
vi.mock('../validator/cancel-appointment-validator', () => ({
  validateCancelAppointment: vi.fn(),
}));

const repo = vi.mocked(appointmentRepository);
const validateCancel = vi.mocked(validateCancelAppointment);

describe('Cancel Appointment command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCancel.mockResolvedValue({
      success: true,
      data: { id: 12, tenantId: 'tenant-1', appointmentCancelledReasonId: 7 },
    });
    repo.cancelAppointment.mockResolvedValue({
      success: true,
      data: { id: 12, bookingNumber: 'APT-1012' } as never,
    });
  });

  it('should return validation errors without writing', async () => {
    validateCancel.mockResolvedValue({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    });

    await expect(cancelAppointmentCommand('12', {}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    });
    expect(repo.cancelAppointment).not.toHaveBeenCalled();
  });

  it('should return the cancelled Appointment', async () => {
    await expect(
      cancelAppointmentCommand('12', { appointmentCancelledReasonId: 7 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: true,
      data: { id: 12, bookingNumber: 'APT-1012' },
    });
    expect(repo.cancelAppointment).toHaveBeenCalledWith({
      id: 12,
      tenantId: 'tenant-1',
      appointmentCancelledReasonId: 7,
    });
  });

  it.each([
    ['not-found' as const, StatusCodes.NOT_FOUND, ['Appointment 12 was not found.']],
    [
      'ineligible' as const,
      StatusCodes.CONFLICT,
      ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    ],
    [
      'invalid-reason' as const,
      StatusCodes.CONFLICT,
      ['Appointment Cancelled Reason is not available.'],
    ],
    [
      'cancelled-status-not-configured' as const,
      StatusCodes.CONFLICT,
      ['Cancelled appointment status is not configured.'],
    ],
  ])('should map the %s repository outcome', async (outcome, status, errors) => {
    repo.cancelAppointment.mockResolvedValue({ success: false, outcome });

    await expect(
      cancelAppointmentCommand('12', { appointmentCancelledReasonId: 7 }, 'tenant-1')
    ).resolves.toEqual({ success: false, status, errors });
  });
});
