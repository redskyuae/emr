import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentTenantIdSchema, bookingNumberSchema } from '../schemas/appointment-schema';

export type GetAppointmentByBookingNumberInput = {
  bookingNumber: string;
  tenantId: string;
};

export function validateGetAppointmentByBookingNumber(
  bookingNumber: unknown,
  tenantId: unknown
): ValidationResult<GetAppointmentByBookingNumberInput> {
  const bookingNumberResult = bookingNumberSchema.safeParse(bookingNumber);
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);

  if (!bookingNumberResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!bookingNumberResult.success) {
      errors.push(...formatValidationErrors(bookingNumberResult.error));
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { bookingNumber: bookingNumberResult.data, tenantId: tenantIdResult.data },
  };
}
