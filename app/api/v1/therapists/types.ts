import type {
  Therapist,
  CreateTherapistInput,
  UpdateTherapistInput,
} from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListTherapistsResponse = Paginated<Therapist>;
export type TherapistResponse = { data: Therapist };
export type SaveTherapistRequest = CreateTherapistInput | UpdateTherapistInput;
export type SaveTherapistResponse = TherapistResponse;
