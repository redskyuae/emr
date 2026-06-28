import type { CurrentUser } from '@/app/api/lib/modules/current-user/schemas/current-user-schema';

export type MeResponse = {
  data: CurrentUser;
};
