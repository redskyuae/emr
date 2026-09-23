import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../repository/appointment-repository';
import type { Appointment } from '../schemas/appointment-schema';
import { validateCreateAppointment } from '../validator/create-appointment-validator';
import { createAppointmentCommand } from './create-appointment-command';

vi.mock('../repository/appointment-repository', () => ({
  appointmentRepository: { createAppointment: vi.fn() },
}));
vi.mock('../validator/create-appointment-validator', () => ({
  validateCreateAppointment: vi.fn(),
}));

const repo = vi.mocked(appointmentRepository);
const validate = vi.mocked(validateCreateAppointment);

const validatedData = {
  bookingPath: 'CONSULTATION' as const,
  tenantId: 'tenant-1',
  timeZone: 'Asia/Kolkata',
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '2099-12-31',
  doctorRotaId: 6,
  slotTimes: ['09:00', '09:15'],
  remarks: undefined,
};

const appointment: Appointment = {
  id: 10,
  tenantId: 'tenant-1',
  bookingNumber: 'APT-1001',
  doctorRotaId: 6,
  cancelledAt: null,
  appointmentCancelledReason: null,
  slotDate: '31-12-2099',
  startTime: '09:00',
  endTime: '09:30',
  bookingPath: 'CONSULTATION',
  rotaName: 'Morning',
  remarks: null,
  createdOn: new Date(),
  treatment: null,
  treatmentSession: null,
  doctor: { id: 1, name: 'Dr. Meera' },
  patient: {
    id: 5,
    mrn: 'MRN-1001',
    firstName: 'Asha',
    lastName: 'Rao',
    phone: '9876543210',
    registrationStatus: 'registered',
  },
  appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
  appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
  appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
  appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
  slots: [
    { slotTime: '09:00', status: 'Booked' },
    { slotTime: '09:15', status: 'Booked' },
  ],
};

describe('createAppointmentCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: validatedData });
    repo.createAppointment.mockResolvedValue({ success: true, data: appointment });
  });

  it('should return validation failure and not write', async () => {
    validate.mockResolvedValue({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: StatusCodes.BAD_REQUEST,
    });
    expect(repo.createAppointment).not.toHaveBeenCalled();
  });

  it('should return created appointment on repository success', async () => {
    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: appointment,
    });
    expect(repo.createAppointment).toHaveBeenCalledWith(validatedData);
  });

  it('should expose potential patient matches on conflict', async () => {
    const registeredPatientMatch = {
      id: 8,
      mrn: 'MRN-1008',
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '9876543210',
      isActive: true,
      registrationStatus: 'registered' as const,
    };
    const patientMatches = [
      registeredPatientMatch,
      {
        id: 9,
        mrn: 'MRN-1009',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'provisional' as const,
      },
    ];
    repo.createAppointment.mockResolvedValue({
      success: false,
      outcome: 'potential-patient-match',
      patientMatches,
    });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Potential Patient match found. Retry with patientId.'],
      patientMatches: [registeredPatientMatch],
    });
  });

  it('should block transactional Provisional Patient matches without exposing them', async () => {
    repo.createAppointment.mockResolvedValue({
      success: false,
      outcome: 'potential-patient-match',
      patientMatches: [
        {
          id: 9,
          mrn: 'MRN-1009',
          firstName: 'Asha',
          lastName: 'Rao',
          phone: '9876543210',
          isActive: true,
          registrationStatus: 'provisional',
        },
      ],
    });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'Matching Provisional Patient must complete or reconcile Patient Registration before another Appointment.',
      ],
    });
  });

  it('should map stale slot conflicts to conflict errors', async () => {
    repo.createAppointment.mockResolvedValue({ success: false, outcome: 'slot-unavailable' });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it('should describe a past Procedure time without referring to Doctor slots', async () => {
    validate.mockResolvedValue({
      success: true,
      data: {
        bookingPath: 'PROCEDURE',
        tenantId: 'tenant-1',
        timeZone: 'Asia/Kolkata',
        patientId: 5,
        slotDate: '2099-12-31',
        startTime: '09:00',
        endTime: '10:00',
        patientTreatmentPlanId: 400,
        patientTreatmentPlanSessionId: 401,
        remarks: undefined,
      },
    });
    repo.createAppointment.mockResolvedValue({ success: false, outcome: 'slot-past' });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Procedure time must be in the future.'],
    });
  });

  it('should map unique slot reservation races to conflict errors', async () => {
    repo.createAppointment.mockRejectedValue({
      cause: { code: '23505', constraint: 'appointment_slot_reservation_active_doctor_slot_idx' },
    });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['One or more selected Doctor slots are no longer available.'],
    });
  });

  it.each(['plan-session-unavailable' as const, 'current-plan-exists' as const])(
    'should map %s to a stable Patient Treatment Plan conflict',
    async (outcome) => {
      repo.createAppointment.mockResolvedValue({ success: false, outcome });

      await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
        success: false,
        status: StatusCodes.CONFLICT,
        errors:
          outcome === 'plan-session-unavailable'
            ? ['The selected Patient Treatment Plan Session is no longer available.']
            : ['Catalogue Treatment cannot be assigned while the Patient has a current Plan.'],
      });
    }
  );

  it('should map a concurrent Patient Treatment Plan Session reservation to a stable conflict', async () => {
    repo.createAppointment.mockRejectedValue({
      cause: { code: '23505', constraint: 'ptp_session_reservation_active_session_idx' },
    });

    await expect(createAppointmentCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['The selected Patient Treatment Plan Session is no longer available.'],
    });
  });
});
