import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import {
  invoiceRepository,
  type BedAutoLine,
  type OccupancyBed,
} from '../repository/invoice-repository';
import { type Invoice, roundMoney } from '../schemas/invoice-schema';
import { validateGenerateBedCharges } from '../validator/generate-bed-charges-validator';
import {
  computeOccupancySegments,
  countBillableDays,
  DEFAULT_TENANT_TIME_ZONE,
} from './bed-day-calculator';

export type GenerateBedChargesData = {
  invoice: Invoice;
  linesAdded: number;
  warnings: string[];
};

export async function generateBedChargesCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<GenerateBedChargesData>> {
  const validationResult = await validateGenerateBedCharges(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, admissionId, tenantId: validTenantId } = validationResult.data;
  const source = await invoiceRepository.getOccupancySource(validTenantId, admissionId);

  if (!source || source.dischargedAt === null) {
    return {
      success: false,
      errors: ['Admission occupancy could not be read'],
      status: StatusCodes.CONFLICT,
    };
  }

  const bedsById = new Map<number, OccupancyBed>(source.beds.map((bed) => [bed.bedId, bed]));
  const segments = computeOccupancySegments({
    admittedAt: source.admittedAt,
    dischargedAt: source.dischargedAt,
    currentBedId: source.currentBedId,
    transfers: source.transfers,
  });

  // Bed-day boundaries are calendar days in the Tenant's own operational clock
  // (ADR 0026), the same resolution the Visit and Appointment modules use.
  const tenant = await tenantRepository.getTenantById(validTenantId);
  const timeZone = tenant?.timeZone ?? DEFAULT_TENANT_TIME_ZONE;

  const lines: BedAutoLine[] = [];
  const warnings: string[] = [];

  for (const segment of segments) {
    const bed = bedsById.get(segment.bedId);
    const days = countBillableDays(segment.start, segment.end, timeZone);

    if (!bed || bed.dailyRate === null) {
      warnings.push(
        `Bed ${bed?.bedNumber ?? segment.bedId} has no daily rate configured; segment skipped.`
      );
      continue;
    }

    lines.push({
      description: `Bed charges — ${bed.bedNumber} (${bed.wardCode}), ${days} day${days === 1 ? '' : 's'} @ ${bed.dailyRate.toFixed(2)}`,
      quantity: days,
      unitPrice: bed.dailyRate,
      amount: roundMoney(days * bed.dailyRate),
    });
  }

  const result = await invoiceRepository.replaceBedAutoLines(validTenantId, invoiceId, lines);

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'not-draft') {
    return {
      success: false,
      errors: [`Invoice ${result.data.invoiceNumber} can only be edited while in Draft.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: { invoice: result.data, linesAdded: lines.length, warnings },
  };
}
