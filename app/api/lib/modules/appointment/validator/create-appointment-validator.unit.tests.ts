import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { validatePatientGovtIdUniqueness } from '../../patient/validator/patient-govt-id-validator';
import { validatePatientReferences } from '../../patient/validator/patient-reference-validator';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import { validateCreateAppointment } from './create-appointment-validator';

vi.mock('../../appointment-mode/repository/appointment-mode-repository', () => ({
  appointmentModeRepository: { getAppointmentModeById: vi.fn() },
}));
vi.mock('../../appointment-reason/repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: { getAppointmentReasonById: vi.fn() },
}));
vi.mock('../../appointment-status/repository/appointment-status-repository', () => ({
  appointmentStatusRepository: { findSystemByCategory: vi.fn() },
}));
vi.mock('../../appointment-type/repository/appointment-type-repository', () => ({
  appointmentTypeRepository: { getAppointmentTypeById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../patient/validator/patient-govt-id-validator', () => ({
  validatePatientGovtIdUniqueness: vi.fn(),
}));
vi.mock('../../patient/validator/patient-reference-validator', () => ({
  validatePatientReferences: vi.fn(),
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: {
    findPotentialPatientMatches: vi.fn(),
    getReservedSlotTimes: vi.fn(),
    getSlotBookingContext: vi.fn(),
  },
}));

const tenantRepo = vi.mocked(tenantRepository);
const modeRepo = vi.mocked(appointmentModeRepository);
const typeRepo = vi.mocked(appointmentTypeRepository);
const reasonRepo = vi.mocked(appointmentReasonRepository);
const statusRepo = vi.mocked(appointmentStatusRepository);
const patientRepo = vi.mocked(patientRepository);
const appointmentRepo = vi.mocked(appointmentRepository);
const validateReferences = vi.mocked(validatePatientReferences);
const validateGovtId = vi.mocked(validatePatientGovtIdUniqueness);

const payload = {
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '31-12-2099',
  doctorRotaId: 6,
  slotTimes: ['09:00', '09:15'],
};

const activePatient = { id: 5, isActive: true };

describe('validateCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      timeZone: 'Asia/Kolkata',
    } as never);
    modeRepo.getAppointmentModeById.mockResolvedValue({ id: 2 } as never);
    typeRepo.getAppointmentTypeById.mockResolvedValue({ id: 3 } as never);
    reasonRepo.getAppointmentReasonById.mockResolvedValue({ id: 4 } as never);
    statusRepo.findSystemByCategory.mockResolvedValue({ id: 7 } as never);
    appointmentRepo.getSlotBookingContext.mockResolvedValue({
      doctorName: 'Dr. Meera',
      rotaName: 'Morning',
      fromTime: '09:00',
      toTime: '10:00',
      durationMinutes: 15,
    });
    appointmentRepo.getReservedSlotTimes.mockResolvedValue([]);
    patientRepo.getPatientById.mockResolvedValue(activePatient as never);
    validateReferences.mockResolvedValue({ success: true, data: undefined });
    validateGovtId.mockResolvedValue({ success: true, data: undefined });
    appointmentRepo.findPotentialPatientMatches.mockResolvedValue([]);
  });

  it('should return schema errors without reading repositories', async () => {
    const result = await validateCreateAppointment({}, 'tenant-1');

    expect(result.success).toBe(false);
    expect(tenantRepo.getTenantById).not.toHaveBeenCalled();
  });

  it('should validate refs, availability, and return normalized data on success', async () => {
    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: {
        ...payload,
        slotDate: '2099-12-31',
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
      },
    });
    expect(statusRepo.findSystemByCategory).toHaveBeenCalledWith('tenant-1', 'SCHEDULED');
    expect(appointmentRepo.getReservedSlotTimes).toHaveBeenCalledWith('tenant-1', 1, '2099-12-31', [
      '09:00',
      '09:15',
    ]);
  });

  it('should reject missing master references as conflict', async () => {
    modeRepo.getAppointmentModeById.mockResolvedValue(undefined);

    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Appointment mode 2 is Invalid.'],
    });
  });

  it('should reject non-consecutive slot selections before checking reservations', async () => {
    const result = await validateCreateAppointment(
      { ...payload, slotTimes: ['09:00', '09:30'] },
      'tenant-1'
    );

    expect(result).toMatchObject({
      success: false,
      errors: ['Selected Doctor slots must exist and be consecutive.'],
    });
    expect(appointmentRepo.getReservedSlotTimes).not.toHaveBeenCalled();
  });

  it('should reject already reserved slots', async () => {
    appointmentRepo.getReservedSlotTimes.mockResolvedValue([{ slotTime: '09:00' }]);

    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it('should reject inactive existing patients', async () => {
    patientRepo.getPatientById.mockResolvedValue({ id: 5, isActive: false } as never);

    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Inactive Patient cannot be booked for an Appointment.'],
    });
  });

  it('should return potential patient matches for provisional booking details', async () => {
    const patientMatches = [
      {
        id: 9,
        mrn: 'MRN-1009',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'registered' as const,
      },
    ];
    appointmentRepo.findPotentialPatientMatches.mockResolvedValue(patientMatches);

    await expect(
      validateCreateAppointment(
        {
          ...payload,
          patientId: undefined,
          provisionalPatient: { firstName: 'Asha', lastName: 'Rao', phone: '9876543210' },
        },
        'tenant-1'
      )
    ).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      patientMatches,
    });
  });
});
