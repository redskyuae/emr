import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusCodes } from 'http-status-codes';

import { appointmentCancelledReasonRepository } from '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import { validateCancelAppointment } from './cancel-appointment-validator';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { getAppointmentById: vi.fn() },
}));
vi.mock(
  '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository',
  () => ({ appointmentCancelledReasonRepository: { getAppointmentCancelledReasonById: vi.fn() } })
);

const appointmentRepo = vi.mocked(appointmentRepository);
const reasonRepo = vi.mocked(appointmentCancelledReasonRepository);

describe('Cancel Appointment validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appointmentRepo.getAppointmentById.mockResolvedValue({
      id: 12,
      appointmentStatus: { category: 'scheduled' },
    } as never);
    reasonRepo.getAppointmentCancelledReasonById.mockResolvedValue({ id: 7 } as never);
  });

  it('should validate an eligible Appointment and active Tenant cancellation reason', async () => {
    await expect(
      validateCancelAppointment('12', { appointmentCancelledReasonId: '7' }, 'tenant-1')
    ).resolves.toEqual({
      success: true,
      data: { id: 12, tenantId: 'tenant-1', appointmentCancelledReasonId: 7 },
    });
    expect(appointmentRepo.getAppointmentById).toHaveBeenCalledWith(12, 'tenant-1');
    expect(reasonRepo.getAppointmentCancelledReasonById).toHaveBeenCalledWith(7, 'tenant-1');
  });

  it('should stop before repositories when the request contract is invalid', async () => {
    await expect(validateCancelAppointment('bad', {}, ' ')).resolves.toMatchObject({
      success: false,
    });
    expect(appointmentRepo.getAppointmentById).not.toHaveBeenCalled();
    expect(reasonRepo.getAppointmentCancelledReasonById).not.toHaveBeenCalled();
  });

  it('should reject another Tenant or missing Appointment without checking the reason', async () => {
    appointmentRepo.getAppointmentById.mockResolvedValue(undefined);

    await expect(
      validateCancelAppointment('12', { appointmentCancelledReasonId: 7 }, 'tenant-2')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment 12 was not found.'],
    });
    expect(reasonRepo.getAppointmentCancelledReasonById).not.toHaveBeenCalled();
  });

  it('should reject an Appointment outside Scheduled or Confirmed', async () => {
    appointmentRepo.getAppointmentById.mockResolvedValue({
      id: 12,
      appointmentStatus: { category: 'checked_in' },
    } as never);

    await expect(
      validateCancelAppointment('12', { appointmentCancelledReasonId: 7 }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    });
    expect(reasonRepo.getAppointmentCancelledReasonById).not.toHaveBeenCalled();
  });

  it('should reject a deleted, missing, or cross-Tenant cancellation reason', async () => {
    reasonRepo.getAppointmentCancelledReasonById.mockResolvedValue(undefined);

    await expect(
      validateCancelAppointment('12', { appointmentCancelledReasonId: 7 }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment Cancelled Reason is not available.'],
    });
  });
});
