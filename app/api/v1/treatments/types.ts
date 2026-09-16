import type { Treatment } from '@/app/api/lib/modules/treatment/schemas/treatment-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListTreatmentsResponse = Paginated<Treatment>;

export type SaveTreatmentRequest = {
  name: string;
  code: string;
  description?: string | null;
  durationMinutes: number;
  setupMinutes?: number;
  cleaningMinutes?: number;
  roomType?: string | null;
  therapistSkill?: string | null;
  sessions: Array<{
    label: string;
    procedure: string;
    sessionNumber: number;
    durationMinutes: number;
    setupMinutes?: number;
    cleaningMinutes?: number;
    preparation?: string | null;
    warning?: string | null;
    equipment?: string | null;
    roomType?: string | null;
    therapistSkill?: string | null;
  }>;
};

export type SaveTreatmentResponse = {
  data: Treatment;
};
