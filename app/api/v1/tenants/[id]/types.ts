import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';

export type GetTenantResponse = {
  data: Tenant;
};

export type UpdateTenantRequest = {
  name?: string;
  logo?: string;
  timeZone?: string;
};

export type UpdateTenantResponse = {
  data: Tenant;
};
