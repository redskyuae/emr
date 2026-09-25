import type { ProcedureResourceAvailability } from '@/app/api/lib/modules/appointment/queries/get-procedure-resource-availability-query';

export type GetProcedureResourceAvailabilityResponse = {
  data: ProcedureResourceAvailability;
};
