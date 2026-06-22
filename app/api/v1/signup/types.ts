import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';

export type SignupRequest = {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
};

export type SignupResponse = {
  data: {
    tenant: Tenant;
  };
};
