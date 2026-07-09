import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';
import type { DoctorRota } from '../schemas/doctor-rota-schema';
import { validateGetDoctorRotas } from '../validator/get-doctor-rotas-validator';

export type GetDoctorRotasParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
};

export async function getDoctorRotasQuery({
  tenantId,
  page,
  limit,
  query,
}: GetDoctorRotasParams): Promise<ListQueryResult<DoctorRota>> {
  const tenantIdValidationResult = validateGetDoctorRotas(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await doctorRotaRepository.getDoctorRotas({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
