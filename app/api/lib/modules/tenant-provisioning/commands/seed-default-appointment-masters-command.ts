import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentCancelledReasonRepository } from '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository';
import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

const DEFAULT_APPOINTMENT_MODES = [
  { code: 'INP', name: 'In-person', description: 'Patient attends the Facility in person' },
  { code: 'VID', name: 'Video', description: 'Remote video consultation' },
  { code: 'PHN', name: 'Phone', description: 'Remote phone consultation' },
] as const;

const DEFAULT_APPOINTMENT_TYPES = [
  { code: 'NEW', name: 'New Consultation', description: 'First consultation for a concern' },
  { code: 'FUP', name: 'Follow-up', description: 'Follow-up consultation' },
  { code: 'EMR', name: 'Emergency', description: 'Emergency consultation' },
  { code: 'PROC', name: 'Procedure', description: 'Procedure appointment' },
] as const;

const DEFAULT_APPOINTMENT_STATUSES = [
  { code: 'SCH', name: 'Scheduled', description: 'Appointment is scheduled' },
  { code: 'CNF', name: 'Confirmed', description: 'Appointment is confirmed' },
  { code: 'CHK', name: 'Checked-in', description: 'Patient has checked in' },
  { code: 'CMP', name: 'Completed', description: 'Appointment is completed' },
  { code: 'CAN', name: 'Cancelled', description: 'Appointment is cancelled' },
  { code: 'NSH', name: 'No-show', description: 'Patient did not attend' },
] as const;

const DEFAULT_APPOINTMENT_REASONS = [
  { code: 'CONS', name: 'Consultation', description: 'General consultation' },
  { code: 'RCHK', name: 'Routine Checkup', description: 'Routine health checkup' },
  { code: 'FLW', name: 'Follow-up', description: 'Follow-up reason' },
  { code: 'EMR', name: 'Emergency', description: 'Emergency reason' },
  { code: 'RSLT', name: 'Results Review', description: 'Review test or diagnostic results' },
] as const;

const DEFAULT_APPOINTMENT_CANCELLED_REASONS = [
  { code: 'PATR', name: 'Patient Request', description: 'Cancelled at the Patient request' },
  { code: 'DOCU', name: 'Doctor Unavailable', description: 'Doctor is unavailable' },
  { code: 'RSCH', name: 'Rescheduled', description: 'Appointment was rescheduled' },
  { code: 'DUPL', name: 'Duplicate Booking', description: 'Duplicate appointment booking' },
  { code: 'OTHR', name: 'Other', description: 'Other cancellation reason' },
] as const;

export async function seedDefaultAppointmentMastersCommand(
  tenantId: unknown
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await Promise.all([
      appointmentModeRepository.seedDefaultAppointmentModes(tenantIdResult.data, [
        ...DEFAULT_APPOINTMENT_MODES,
      ]),
      appointmentTypeRepository.seedDefaultAppointmentTypes(tenantIdResult.data, [
        ...DEFAULT_APPOINTMENT_TYPES,
      ]),
      appointmentStatusRepository.seedDefaultAppointmentStatuses(tenantIdResult.data, [
        ...DEFAULT_APPOINTMENT_STATUSES,
      ]),
      appointmentReasonRepository.seedDefaultAppointmentReasons(tenantIdResult.data, [
        ...DEFAULT_APPOINTMENT_REASONS,
      ]),
      appointmentCancelledReasonRepository.seedDefaultAppointmentCancelledReasons(
        tenantIdResult.data,
        [...DEFAULT_APPOINTMENT_CANCELLED_REASONS]
      ),
    ]);
  } catch {
    return { success: false, errors: ['Failed to seed default appointment masters.'] };
  }

  return { success: true, data: undefined };
}
