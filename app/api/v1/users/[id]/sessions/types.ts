import type { SessionListItem } from '@/app/api/lib/modules/session/schemas/session-schema';

export type ListUserSessionsResponse = {
  data: SessionListItem[];
  meta: {
    total: number;
  };
};

export type RevokeUserSessionsResponse = void;
