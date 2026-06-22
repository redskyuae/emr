import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';

export type DeactivateTenantResponse = {
  data: Tenant;
};
