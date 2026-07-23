import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { getAppointmentByBookingNumberQuery } from './get-appointment-by-booking-number-query';
import { getAppointmentByIdQuery } from './get-appointment-by-id-query';
import { getAppointmentsQuery } from './get-appointments-query';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: {
    getAppointments: vi.fn(),
    getAppointmentById: vi.fn(),
    getAppointmentByBookingNumber: vi.fn(),
  },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const repo = vi.mocked(appointmentRepository);
const tenantRepo = vi.mocked(tenantRepository);
const appointment = { id: 5, bookingNumber: 'APT-1042' } as Appointment;

describe('Appointment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T04:30:00Z'));
    repo.getAppointments.mockResolvedValue({ data: [appointment], total: 1 });
    repo.getAppointmentByBookingNumber.mockResolvedValue(appointment);
    repo.getAppointmentById.mockResolvedValue(appointment);
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      timeZone: 'Asia/Kolkata',
    } as never);
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

  describe('getAppointmentsQuery', () => {
    it('should short-circuit and not call the repository when the tenant is blank', async () => {
      const result = await getAppointmentsQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getAppointments).not.toHaveBeenCalled();
    });

    it('should default to the tenant local today when no date or patient filter is given', async () => {
      await getAppointmentsQuery({ tenantId: 'tenant-1', filters: {} });

      expect(repo.getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        slotDate: '2026-07-16',
      });
    });

    it('should not default the date when listing one patient history', async () => {
      await getAppointmentsQuery({ tenantId: 'tenant-1', filters: { patientId: 7 } });

      expect(repo.getAppointments).toHaveBeenCalledWith({ tenantId: 'tenant-1', patientId: 7 });
      expect(tenantRepo.getTenantById).not.toHaveBeenCalled();
    });

    it('should respect an explicit slot date filter', async () => {
      await getAppointmentsQuery({ tenantId: 'tenant-1', filters: { slotDate: '15-07-2026' } });

      expect(repo.getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        slotDate: '2026-07-15',
      });
    });

    it('should pass filters and paging through to the repository', async () => {
      await getAppointmentsQuery({
        tenantId: 'tenant-1',
        filters: {
          doctorId: 3,
          page: 2,
          limit: 5,
          query: 'rao',
          appointmentStatusId: 9,
        },
      });

      expect(repo.getAppointments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        slotDate: '2026-07-16',
        doctorId: 3,
        page: 2,
        limit: 5,
        query: 'rao',
        appointmentStatusId: 9,
      });
    });

    it('should not default the date when the tenant cannot be read', async () => {
      tenantRepo.getTenantById.mockResolvedValue(undefined);

      await getAppointmentsQuery({ tenantId: 'tenant-1', filters: {} });

      expect(repo.getAppointments).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    });

    it('should return the list query result shape', async () => {
      await expect(getAppointmentsQuery({ tenantId: 'tenant-1', filters: {} })).resolves.toEqual({
        success: true,
        data: [appointment],
        total: 1,
      });
    });
  });
});

describe('getAppointmentByIdQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getAppointmentById.mockResolvedValue(appointment);
  });

  it('should return the appointment for a valid id', async () => {
    const result = await getAppointmentByIdQuery('5', 'tenant-1');

    expect(result).toEqual({ success: true, data: appointment });
    expect(repo.getAppointmentById).toHaveBeenCalledWith(5, 'tenant-1');
  });

  it('should not call the repository when the id is invalid', async () => {
    const result = await getAppointmentByIdQuery('abc', 'tenant-1');

    expect(result).toMatchObject({ success: false, errors: ['Appointment abc is Invalid.'] });
    expect(repo.getAppointmentById).not.toHaveBeenCalled();
  });

  it('should return not-found when the appointment does not exist in the tenant', async () => {
    repo.getAppointmentById.mockResolvedValue(undefined);

    const result = await getAppointmentByIdQuery('5', 'tenant-1');

    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Appointment not found'],
    });
  });
});
