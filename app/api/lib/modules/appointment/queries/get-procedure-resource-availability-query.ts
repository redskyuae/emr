import { appointmentRepository } from '../repository/appointment-repository';
import { validateGetProcedureResourceAvailability } from '../validator/get-procedure-resource-availability-validator';

export type ProcedureResourceAvailability = {
  roomIds: number[];
  therapistIds: number[];
  patientUnavailable: boolean;
};

export async function getProcedureResourceAvailabilityQuery(input: unknown, tenantId: unknown) {
  const validation = validateGetProcedureResourceAvailability(input, tenantId);
  if (!validation.success) return validation;

  return {
    success: true as const,
    data: await appointmentRepository.getUnavailableProcedureResources(validation.data),
  };
}
