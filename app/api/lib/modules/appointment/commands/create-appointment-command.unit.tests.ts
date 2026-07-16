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
  slotDate: '31-12-2099',
  rotaName: 'Morning',
  remarks: null,
  createdOn: new Date(),
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
    const patientMatches = [
      {
        id: 8,
        mrn: 'MRN-1008',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'registered' as const,
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
      patientMatches,
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
});
