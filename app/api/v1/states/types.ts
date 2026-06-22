import type { State } from '@/app/api/lib/modules/state/schemas/state-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListStatesResponse = Paginated<State>;

export type SaveStateRequest = {
  name: string;
  countryId: number;
};

export type SaveStateResponse = {
  data: State;
};
