import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import { validatePatientEmiratesIdUniqueness } from '../../patient/validator/patient-emirates-id-validator';
import { validatePatientReferences } from '../../patient/validator/patient-reference-validator';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { therapistRepository } from '../../therapist/repository/therapist-repository';
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
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../patient-treatment-plan/repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { getCurrentByPatientId: vi.fn() },
}));
vi.mock('../../patient/validator/patient-emirates-id-validator', () => ({
  validatePatientEmiratesIdUniqueness: vi.fn(),
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
vi.mock('../../treatment/repository/treatment-repository', () => ({
  treatmentRepository: { getTreatmentById: vi.fn(), getTreatmentSessionById: vi.fn() },
}));
vi.mock('../../therapist/repository/therapist-repository', () => ({
  therapistRepository: { getTherapistById: vi.fn() },
}));

const tenantRepo = vi.mocked(tenantRepository);
const modeRepo = vi.mocked(appointmentModeRepository);
const typeRepo = vi.mocked(appointmentTypeRepository);
const reasonRepo = vi.mocked(appointmentReasonRepository);
const statusRepo = vi.mocked(appointmentStatusRepository);
const patientRepo = vi.mocked(patientRepository);
const planRepo = vi.mocked(patientTreatmentPlanRepository);
const doctorRepo = vi.mocked(doctorRepository);
const appointmentRepo = vi.mocked(appointmentRepository);
const treatmentRepo = vi.mocked(treatmentRepository);
const therapistRepo = vi.mocked(therapistRepository);
const validateReferences = vi.mocked(validatePatientReferences);
const validateEmiratesId = vi.mocked(validatePatientEmiratesIdUniqueness);

const payload = {
  bookingPath: 'CONSULTATION',
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '31-12-2099',
  doctorRotaId: 6,
  slotTimes: ['09:00', '09:15'],
};

const procedurePayload = {
  bookingPath: 'PROCEDURE',
  patientId: 5,
  slotDate: '31-12-2099',
  startTime: '10:00',
  endTime: '11:15',
  patientTreatmentPlanId: 400,
  patientTreatmentPlanSessionId: 401,
};

const catalogueProcedurePayload = {
  bookingPath: 'PROCEDURE',
  patientId: 5,
  slotDate: '31-12-2099',
  startTime: '10:00',
  endTime: '11:15',
  treatmentId: 500,
};

const currentPlan = {
  id: 400,
  treatmentId: 500,
  sessions: [{ id: 401, treatmentSessionId: 501, isBookable: true }],
};

const repeatableTreatment = {
  id: 500,
  sessionStructure: 'REPEATABLE',
  defaultTotalSessions: 6,
  therapistSkillId: null,
  sessions: [{ id: 501, sessionNumber: 1, therapistSkillId: 10 }],
};

const activePatient = { id: 5, isActive: true, registrationStatus: 'registered' as const };

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
    doctorRepo.getDoctorById.mockResolvedValue({ id: 1, isActive: true } as never);
    planRepo.getCurrentByPatientId.mockResolvedValue([currentPlan] as never);
    treatmentRepo.getTreatmentById.mockResolvedValue(repeatableTreatment as never);
    treatmentRepo.getTreatmentSessionById.mockResolvedValue(
      repeatableTreatment.sessions[0] as never
    );
    therapistRepo.getTherapistById.mockResolvedValue({
      id: 8,
      isActive: true,
      skills: [{ id: 10 }],
    } as never);
    validateReferences.mockResolvedValue({ success: true, data: undefined });
    validateEmiratesId.mockResolvedValue({ success: true, data: undefined });
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

  it('should validate a Procedure with Doctor N/A without reading scheduling repositories', async () => {
    await expect(validateCreateAppointment(procedurePayload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: {
        ...procedurePayload,
        slotDate: '2099-12-31',
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
      },
    });

    expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
    expect(modeRepo.getAppointmentModeById).not.toHaveBeenCalled();
    expect(typeRepo.getAppointmentTypeById).not.toHaveBeenCalled();
    expect(reasonRepo.getAppointmentReasonById).not.toHaveBeenCalled();
    expect(appointmentRepo.getSlotBookingContext).not.toHaveBeenCalled();
    expect(appointmentRepo.getReservedSlotTimes).not.toHaveBeenCalled();
    expect(planRepo.getCurrentByPatientId).toHaveBeenCalledWith(5, 'tenant-1');
  });

  it('should reject an existing Plan Session outside the selected Patient and Tenant current Plans', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);

    await expect(validateCreateAppointment(procedurePayload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan Session is Invalid.'],
    });
  });

  it('should reject an unavailable existing Plan Session', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([
      { ...currentPlan, sessions: [{ id: 401, isBookable: false }] },
    ] as never);

    await expect(validateCreateAppointment(procedurePayload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Patient Treatment Plan Session is not available.'],
    });
  });

  it('should accept a Therapist qualified for the selected Plan Session', async () => {
    await expect(
      validateCreateAppointment({ ...procedurePayload, therapistId: 8 }, 'tenant-1')
    ).resolves.toMatchObject({ success: true, data: { therapistId: 8 } });

    expect(treatmentRepo.getTreatmentSessionById).toHaveBeenCalledWith(501, 'tenant-1');
    expect(therapistRepo.getTherapistById).toHaveBeenCalledWith(8, 'tenant-1');
  });

  it('should reject a Therapist without the skill required by the selected Plan Session', async () => {
    therapistRepo.getTherapistById.mockResolvedValue({
      id: 8,
      isActive: true,
      skills: [],
    } as never);

    await expect(
      validateCreateAppointment({ ...procedurePayload, therapistId: 8 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Therapist 8 does not have the required Therapist Skill.'],
    });
  });

  it('should reject catalogue fallback when any current Plan exists', async () => {
    await expect(
      validateCreateAppointment(catalogueProcedurePayload, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Catalogue Treatment cannot be assigned while the Patient has a current Plan.'],
    });
  });

  it('should normalize a Repeatable Treatment count from its default', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);

    await expect(
      validateCreateAppointment(catalogueProcedurePayload, 'tenant-1')
    ).resolves.toMatchObject({
      success: true,
      data: { treatmentId: 500, totalSessions: 6 },
    });
  });

  it('should preserve a caller count for a Repeatable Treatment', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);

    await expect(
      validateCreateAppointment({ ...catalogueProcedurePayload, totalSessions: 8 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: true,
      data: { treatmentId: 500, totalSessions: 8 },
    });
  });

  it('should require a count for a Repeatable Treatment without a default', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);
    treatmentRepo.getTreatmentById.mockResolvedValue({
      ...repeatableTreatment,
      defaultTotalSessions: null,
    } as never);

    await expect(
      validateCreateAppointment(catalogueProcedurePayload, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      errors: ['Total Sessions is required for a Repeatable Treatment without a default.'],
    });
  });

  it('should reject a caller count for a Sequenced Treatment', async () => {
    planRepo.getCurrentByPatientId.mockResolvedValue([]);
    treatmentRepo.getTreatmentById.mockResolvedValue({
      id: 500,
      sessionStructure: 'SEQUENCED',
      defaultTotalSessions: null,
      sessions: [{ id: 501 }, { id: 502 }],
    } as never);

    await expect(
      validateCreateAppointment({ ...catalogueProcedurePayload, totalSessions: 2 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      errors: ['Sequenced Treatments derive their count from Session templates.'],
    });
  });

  it('should validate an active Procedure Doctor without reading scheduling repositories', async () => {
    await expect(
      validateCreateAppointment({ ...procedurePayload, doctorId: 1 }, 'tenant-1')
    ).resolves.toMatchObject({ success: true });

    expect(doctorRepo.getDoctorById).toHaveBeenCalledWith(1, 'tenant-1');
    expect(appointmentRepo.getSlotBookingContext).not.toHaveBeenCalled();
    expect(appointmentRepo.getReservedSlotTimes).not.toHaveBeenCalled();
  });

  it('should reject an inactive Procedure Doctor', async () => {
    doctorRepo.getDoctorById.mockResolvedValue({ id: 1, isActive: false } as never);

    await expect(
      validateCreateAppointment({ ...procedurePayload, doctorId: 1 }, 'tenant-1')
    ).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor 1 is inactive and cannot be assigned to an Appointment.'],
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
    patientRepo.getPatientById.mockResolvedValue({
      id: 5,
      isActive: false,
      registrationStatus: 'registered',
    } as never);

    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Inactive Patient cannot be booked for an Appointment.'],
    });
  });

  it('should reject an existing Provisional Patient before another Appointment', async () => {
    patientRepo.getPatientById.mockResolvedValue({
      id: 5,
      isActive: true,
      registrationStatus: 'provisional',
    } as never);

    await expect(validateCreateAppointment(payload, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'Provisional Patient must complete or reconcile Patient Registration before another Appointment.',
      ],
    });
  });

  it('should return potential patient matches for provisional booking details', async () => {
    const registeredPatientMatch = {
      id: 9,
      mrn: 'MRN-1009',
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '9876543210',
      isActive: true,
      registrationStatus: 'registered' as const,
    };
    const patientMatches = [
      registeredPatientMatch,
      {
        id: 10,
        mrn: 'MRN-1010',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'provisional' as const,
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
      patientMatches: [registeredPatientMatch],
    });
  });

  it('should block a matching Provisional Patient without returning a selectable match', async () => {
    appointmentRepo.findPotentialPatientMatches.mockResolvedValue([
      {
        id: 9,
        mrn: 'MRN-1009',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'provisional',
      },
    ]);

    await expect(
      validateCreateAppointment(
        {
          ...payload,
          patientId: undefined,
          provisionalPatient: { firstName: 'Asha', lastName: 'Rao', phone: '9876543210' },
        },
        'tenant-1'
      )
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'Matching Provisional Patient must complete or reconcile Patient Registration before another Appointment.',
      ],
    });
  });
});
