import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { getAppointmentByBookingNumberQuery } from './get-appointment-by-booking-number-query';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { getAppointmentByBookingNumber: vi.fn() },
}));

const repo = vi.mocked(appointmentRepository);
const appointment = { id: 5, bookingNumber: 'APT-1042' } as Appointment;

describe('Appointment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getAppointmentByBookingNumber.mockResolvedValue(appointment);
  });

  describe('getAppointmentByBookingNumberQuery', () => {
    it('should not call the repository when the booking number is missing', async () => {
      const result = await getAppointmentByBookingNumberQuery(undefined, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Booking Number is required'] });
      expect(repo.getAppointmentByBookingNumber).not.toHaveBeenCalled();
    });

    it('should not call the repository when the booking number is blank', async () => {
      const result = await getAppointmentByBookingNumberQuery('   ', 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Booking Number cannot be empty'] });
      expect(repo.getAppointmentByBookingNumber).not.toHaveBeenCalled();
    });

    it('should not call the repository when the tenant id is blank', async () => {
      const result = await getAppointmentByBookingNumberQuery('APT-1042', '  ');

      expect(result.success).toBe(false);
      expect(repo.getAppointmentByBookingNumber).not.toHaveBeenCalled();
    });

    it('should trim the booking number before the lookup', async () => {
      await getAppointmentByBookingNumberQuery(' APT-1042 ', 'tenant-1');

      expect(repo.getAppointmentByBookingNumber).toHaveBeenCalledWith('APT-1042', 'tenant-1');
    });

    it('should return not found with the booking number in the message', async () => {
      repo.getAppointmentByBookingNumber.mockResolvedValue(undefined);

      await expect(
        getAppointmentByBookingNumberQuery('APT-9999', 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Appointment APT-9999 is Invalid.'],
      });
    });

    it('should return the appointment on success', async () => {
      await expect(getAppointmentByBookingNumberQuery('APT-1042', 'tenant-1')).resolves.toEqual({
        success: true,
        data: appointment,
      });
    });
  });
});
