import type { SessionListItem } from '@/app/api/lib/modules/session/schemas/session-schema';

export type ListSessionsResponse = {
  data: SessionListItem[];
  meta: {
    total: number;
  };
};

export type RevokeAllSessionsResponse = void;
