import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListBedsResponse = Paginated<Bed>;

export type SaveBedRequest = {
  bedNumber: string;
  wardId: number;
  roomId?: number | null;
  notes?: string | null;
  status?: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
};

export type SaveBedResponse = {
  data: Bed;
};
