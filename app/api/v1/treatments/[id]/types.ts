import type { Treatment } from '@/app/api/lib/modules/treatment/schemas/treatment-schema';

export type GetTreatmentResponse = {
  data: Treatment;
};

export type UpdateTreatmentRequest = {
  name: string;
  code: string;
  description?: string | null;
  durationMinutes: number;
  setupMinutes?: number;
  cleaningMinutes?: number;
  roomType?: string | null;
  therapistSkill?: string | null;
};

export type UpdateTreatmentResponse = {
  data: Treatment;
};

export type DeleteTreatmentResponse = void;
