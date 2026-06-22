import type { State } from '@/app/api/lib/modules/state/schemas/state-schema';

export type GetStateResponse = {
  data: State;
};

export type UpdateStateRequest = {
  name: string;
  countryId: number;
};

export type UpdateStateResponse = {
  data: State;
};

export type DeleteStateResponse = void;
