import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admitSourceRepository } from '../repository/admit-source-repository';
import type { AdmitSource } from '../schemas/admit-source-schema';
import { validateDeleteAdmitSource } from '../validator/delete-admit-source-validator';

export async function deleteAdmitSourceCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AdmitSource>> {
  const validationResult = validateDeleteAdmitSource(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedAdmitSource = await admitSourceRepository.deleteAdmitSource(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAdmitSource) {
    return {
      success: false,
      errors: ['Admit source not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAdmitSource };
}
