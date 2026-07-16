import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../../appointment/repository/appointment-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';
import { visitRepository } from '../repository/visit-repository';
import { validateCancelVisit } from './cancel-visit-validator';
import { validateCheckInVisit } from './check-in-visit-validator';
import { validateDeleteVisit } from './delete-visit-validator';
import { validateGetVisitById } from './get-visit-by-id-validator';
import { validateGetVisits } from './get-visits-validator';
import { validateUpdateVisit } from './update-visit-validator';
import { validateVisitForClinicalCapture } from './visit-clinical-capture-validator';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: {
    getVisitById: vi.fn(),
    findActiveVisitByPatientId: vi.fn(),
    findNonCancelledVisitByAppointmentId: vi.fn(),
    getVisitForClinicalCapture: vi.fn(),
  },
}));
vi.mock('../../appointment/repository/appointment-repository', () => ({
  appointmentRepository: { getAppointmentById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../../visit-type/repository/visit-type-repository', () => ({
  visitTypeRepository: { getVisitTypeById: vi.fn() },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const visitRepo = vi.mocked(visitRepository);
const appointmentRepo = vi.mocked(appointmentRepository);
const patientRepo = vi.mocked(patientRepository);
const doctorRepo = vi.mocked(doctorRepository);
const visitTypeRepo = vi.mocked(visitTypeRepository);
const tenantRepo = vi.mocked(tenantRepository);

// The Tenant clock decides "today"; freeze it so the date gate is deterministic.
const NOW = new Date('2026-07-16T04:30:00Z'); // 10:00 on 16-07-2026 in Asia/Kolkata
const TODAY_DDMMYYYY = '16-07-2026';

const registeredPatient = { id: 7, isActive: true, registrationStatus: 'registered' };
const appointment = {
  id: 5,
  bookingNumber: 'APT-1042',
  slotDate: TODAY_DDMMYYYY,
  patient: { id: 7 },
  doctor: { id: 3 },
  appointmentStatus: { category: 'scheduled' },
};

describe('Visit validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      timeZone: 'Asia/Kolkata',
    } as never);
    visitTypeRepo.getVisitTypeById.mockResolvedValue({ id: 2, name: 'OPD' } as never);
    appointmentRepo.getAppointmentById.mockResolvedValue(appointment as never);
    patientRepo.getPatientById.mockResolvedValue(registeredPatient as never);
    doctorRepo.getDoctorById.mockResolvedValue({ id: 3, isActive: true } as never);
    visitRepo.findActiveVisitByPatientId.mockResolvedValue(undefined);
    visitRepo.findNonCancelledVisitByAppointmentId.mockResolvedValue(undefined);
  });

  describe('validateCheckInVisit', () => {
    it('should not touch repositories when schema parsing fails', async () => {
      const result = await validateCheckInVisit({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(appointmentRepo.getAppointmentById).not.toHaveBeenCalled();
      expect(patientRepo.getPatientById).not.toHaveBeenCalled();
    });

    it('should resolve patient and doctor from the appointment', async () => {
      const result = await validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1');

      expect(result).toEqual({
        success: true,
        data: {
          tenantId: 'tenant-1',
          patientId: 7,
          doctorId: 3,
          visitTypeId: 2,
          appointmentId: 5,
          chiefComplaint: undefined,
          remarks: undefined,
          visitDate: '2026-07-16',
        },
      });
    });

    it('should take the visit date from the tenant time zone, not the server clock', async () => {
      // 04:30Z on the 16th is still 17:30 on the 15th in Midway (UTC-11), so a
      // 16-07 Appointment is not "today" for a Midway tenant.
      tenantRepo.getTenantById.mockResolvedValue({
        id: 'tenant-1',
        timeZone: 'Pacific/Midway',
      } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        errors: ['Appointment APT-1042 is not scheduled for today.'],
      });
    });

    it('should stamp the visit date from the tenant time zone on a walk-in', async () => {
      tenantRepo.getTenantById.mockResolvedValue({
        id: 'tenant-1',
        timeZone: 'Pacific/Midway',
      } as never);

      await expect(
        validateCheckInVisit({ patientId: 7, doctorId: 3, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({ success: true, data: { visitDate: '2026-07-15' } });
    });

    it('should reject an unknown visit type', async () => {
      visitTypeRepo.getVisitTypeById.mockResolvedValue(undefined);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 99 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit type 99 is Invalid.'],
      });
    });

    it('should reject an unknown appointment', async () => {
      appointmentRepo.getAppointmentById.mockResolvedValue(undefined);

      await expect(
        validateCheckInVisit({ appointmentId: 99, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Appointment 99 is Invalid.'],
      });
    });

    it('should reject an appointment scheduled for another day', async () => {
      appointmentRepo.getAppointmentById.mockResolvedValue({
        ...appointment,
        slotDate: '17-07-2026',
      } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Appointment APT-1042 is not scheduled for today.'],
      });
    });

    it('should accept a confirmed appointment', async () => {
      appointmentRepo.getAppointmentById.mockResolvedValue({
        ...appointment,
        appointmentStatus: { category: 'confirmed' },
      } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({ success: true });
    });

    it.each(['completed', 'cancelled', 'no_show', 'checked_in'])(
      'should reject an appointment in the %s category',
      async (category) => {
        appointmentRepo.getAppointmentById.mockResolvedValue({
          ...appointment,
          appointmentStatus: { category },
        } as never);

        await expect(
          validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
        ).resolves.toMatchObject({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Appointment APT-1042 is not in a checked-in eligible status.'],
        });
      }
    );

    it('should reject an appointment that already has a visit', async () => {
      visitRepo.findNonCancelledVisitByAppointmentId.mockResolvedValue({ id: 1 } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Appointment APT-1042 already has a visit.'],
      });
    });

    it('should reject a provisional patient', async () => {
      patientRepo.getPatientById.mockResolvedValue({
        ...registeredPatient,
        registrationStatus: 'provisional',
      } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 7 is provisional and must complete registration before check-in.'],
      });
    });

    it('should reject an inactive patient', async () => {
      patientRepo.getPatientById.mockResolvedValue({
        ...registeredPatient,
        isActive: false,
      } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 7 is inactive and cannot be checked in.'],
      });
    });

    it('should reject a patient who already has an active visit', async () => {
      visitRepo.findActiveVisitByPatientId.mockResolvedValue({ id: 1 } as never);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 7 already has an active visit.'],
      });
    });

    it('should validate the doctor for a walk-in', async () => {
      const result = await validateCheckInVisit(
        { patientId: 7, doctorId: 3, visitTypeId: 2 },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: true,
        data: { patientId: 7, doctorId: 3, appointmentId: undefined },
      });
      expect(doctorRepo.getDoctorById).toHaveBeenCalledWith(3, 'tenant-1');
      expect(appointmentRepo.getAppointmentById).not.toHaveBeenCalled();
    });

    it('should reject an unknown doctor for a walk-in', async () => {
      doctorRepo.getDoctorById.mockResolvedValue(undefined);

      await expect(
        validateCheckInVisit({ patientId: 7, doctorId: 99, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Doctor 99 is Invalid.'],
      });
    });

    it('should reject an inactive doctor for a walk-in', async () => {
      doctorRepo.getDoctorById.mockResolvedValue({ id: 3, isActive: false } as never);

      await expect(
        validateCheckInVisit({ patientId: 7, doctorId: 3, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Doctor 3 is inactive and cannot be assigned a Visit.'],
      });
    });

    it('should reject an unknown patient for a walk-in', async () => {
      patientRepo.getPatientById.mockResolvedValue(undefined);

      await expect(
        validateCheckInVisit({ patientId: 99, doctorId: 3, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Patient 99 is Invalid.'],
      });
    });

    it('should reject when the tenant is missing', async () => {
      tenantRepo.getTenantById.mockResolvedValue(undefined);

      await expect(
        validateCheckInVisit({ appointmentId: 5, visitTypeId: 2 }, 'tenant-1')
      ).resolves.toMatchObject({ success: false, errors: ['Tenant not found'] });
    });
  });

  describe('validateUpdateVisit', () => {
    beforeEach(() => {
      visitRepo.getVisitById.mockResolvedValue({
        id: 1,
        visitNumber: 'VST-1001',
        status: 'CHECKED_IN',
      } as never);
    });

    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateVisit('abc', {}, 'tenant-1');

      expect(result).toMatchObject({ success: false, errors: ['Visit abc is Invalid.'] });
      expect(visitRepo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit does not exist', async () => {
      visitRepo.getVisitById.mockResolvedValue(undefined);

      await expect(validateUpdateVisit('1', {}, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
      });
    });

    it.each(['COMPLETED', 'CANCELLED'])('should reject editing a %s visit', async (status) => {
      visitRepo.getVisitById.mockResolvedValue({
        id: 1,
        visitNumber: 'VST-1001',
        status,
      } as never);

      await expect(validateUpdateVisit('1', {}, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Visit VST-1001 is closed and cannot be edited.'],
      });
    });

    it('should accept editing an active visit', async () => {
      await expect(
        validateUpdateVisit('1', { chiefComplaint: 'Fever' }, 'tenant-1')
      ).resolves.toMatchObject({
        success: true,
        data: { id: 1, payload: { chiefComplaint: 'Fever' } },
      });
    });
  });

  describe('validateCancelVisit', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateCancelVisit('abc', { cancellationReason: 'Left' })).toMatchObject({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
    });

    it('should require the cancellation reason', () => {
      expect(validateCancelVisit('1', {})).toMatchObject({ success: false });
    });

    it('should return the id and reason on success', () => {
      expect(validateCancelVisit('1', { cancellationReason: ' Patient left ' })).toEqual({
        success: true,
        data: { id: 1, payload: { cancellationReason: 'Patient left' } },
      });
    });
  });

  describe('validateGetVisitById / validateDeleteVisit', () => {
    it('should reject a non-numeric id with the visit wording', () => {
      expect(validateGetVisitById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
      expect(validateDeleteVisit('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
    });

    it('should reject a blank tenant id', () => {
      expect(validateGetVisitById('1', '  ')).toMatchObject({ success: false });
    });

    it('should return the id and tenant on success', () => {
      expect(validateGetVisitById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetVisits', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetVisits({}, '  ')).toMatchObject({ success: false });
    });

    it('should reject an invalid status filter', () => {
      expect(validateGetVisits({ status: 'NOPE' }, 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Status is Invalid.'],
      });
    });

    it('should default missing filters to an empty filter set', () => {
      expect(validateGetVisits(undefined, 'tenant-1')).toEqual({
        success: true,
        data: { tenantId: 'tenant-1' },
      });
    });

    it('should transform the visit date filter to ISO', () => {
      expect(validateGetVisits({ visitDate: '16-07-2026' }, 'tenant-1')).toMatchObject({
        success: true,
        data: { visitDate: '2026-07-16', tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateVisitForClinicalCapture', () => {
    it('should reject an unknown visit', async () => {
      visitRepo.getVisitForClinicalCapture.mockResolvedValue(undefined);

      await expect(validateVisitForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.BAD_REQUEST,
        errors: ['Visit 9 is Invalid.'],
      });
    });

    it('should reject a visit belonging to another patient', async () => {
      visitRepo.getVisitForClinicalCapture.mockResolvedValue({
        id: 9,
        patientId: 8,
        status: 'CHECKED_IN',
      });

      await expect(validateVisitForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.BAD_REQUEST,
        errors: ['Visit 9 does not belong to patient 7.'],
      });
    });

    it.each(['COMPLETED', 'CANCELLED'] as const)(
      'should reject capturing against a %s visit',
      async (status) => {
        visitRepo.getVisitForClinicalCapture.mockResolvedValue({ id: 9, patientId: 7, status });

        await expect(validateVisitForClinicalCapture(9, 7, 'tenant-1')).resolves.toMatchObject({
          success: false,
          status: StatusCodes.CONFLICT,
          errors: ['Visit 9 is not active.'],
        });
      }
    );

    it.each(['CHECKED_IN', 'IN_CONSULTATION'] as const)(
      'should accept capturing against a %s visit',
      async (status) => {
        visitRepo.getVisitForClinicalCapture.mockResolvedValue({ id: 9, patientId: 7, status });

        await expect(validateVisitForClinicalCapture(9, 7, 'tenant-1')).resolves.toEqual({
          success: true,
          data: undefined,
        });
      }
    );
  });
});
