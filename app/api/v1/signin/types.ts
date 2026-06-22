import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';

export type SigninRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SigninResponse = {
  data: {
    tenant: Tenant;
  };
};
