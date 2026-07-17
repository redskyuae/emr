import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';

export type GetBedResponse = {
  data: Bed;
};

export type UpdateBedRequest = {
  bedNumber: string;
  wardId: number;
  roomId?: number | null;
  notes?: string | null;
  status?: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
};

export type UpdateBedResponse = {
  data: Bed;
};

export type DeleteBedResponse = void;
