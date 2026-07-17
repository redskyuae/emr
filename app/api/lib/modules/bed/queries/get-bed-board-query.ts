import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { type BedBoardRow, bedRepository } from '../repository/bed-repository';
import type { BedBoardBed, BedBoardWard } from '../schemas/bed-schema';
import { validateGetBeds } from '../validator/get-beds-validator';

function toBoardBed(row: BedBoardRow): BedBoardBed {
  const occupied =
    row.admissionId !== null &&
    row.admissionNumber !== null &&
    row.patientId !== null &&
    row.mrn !== null &&
    row.firstName !== null &&
    row.lastName !== null;

  return {
    id: row.bedId,
    status: row.status,
    bedNumber: row.bedNumber,
    roomNumber: row.roomNumber,
    occupant: occupied
      ? {
          mrn: row.mrn!,
          patientId: row.patientId!,
          lastName: row.lastName!,
          firstName: row.firstName!,
          admissionId: row.admissionId!,
          admissionNumber: row.admissionNumber!,
        }
      : null,
  };
}

export async function getBedBoardQuery(
  tenantId: unknown
): Promise<SingleQueryResult<BedBoardWard[]>> {
  const tenantIdValidationResult = validateGetBeds(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const rows = await bedRepository.getBedBoard(tenantIdValidationResult.data);
  const wards = new Map<number, BedBoardWard>();

  for (const row of rows) {
    let wardEntry = wards.get(row.wardId);

    if (!wardEntry) {
      wardEntry = {
        wardId: row.wardId,
        wardName: row.wardName,
        wardCode: row.wardCode,
        beds: [],
      };
      wards.set(row.wardId, wardEntry);
    }

    wardEntry.beds.push(toBoardBed(row));
  }

  return { success: true, data: [...wards.values()] };
}
