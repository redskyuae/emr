'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { countriesQueryKey } from '@/app/queries/global-references/useCountries';
import { languagesQueryKey } from '@/app/queries/global-references/useLanguages';
import { nationalitiesQueryKey } from '@/app/queries/global-references/useNationalities';
import { religionsQueryKey } from '@/app/queries/global-references/useReligions';
import type {
  ListCountriesResponse,
  SaveCountryRequest,
  SaveCountryResponse,
} from '@/app/api/v1/countries/types';
import type {
  GetCountryResponse,
  UpdateCountryRequest,
  UpdateCountryResponse,
} from '@/app/api/v1/countries/[id]/types';
import type {
  ListLanguagesResponse,
  SaveLanguageRequest,
  SaveLanguageResponse,
} from '@/app/api/v1/languages/types';
import type {
  GetLanguageResponse,
  UpdateLanguageRequest,
  UpdateLanguageResponse,
} from '@/app/api/v1/languages/[id]/types';
import type {
  ListNationalitiesResponse,
  SaveNationalityRequest,
  SaveNationalityResponse,
} from '@/app/api/v1/nationalities/types';
import type {
  GetNationalityResponse,
  UpdateNationalityRequest,
  UpdateNationalityResponse,
} from '@/app/api/v1/nationalities/[id]/types';
import type {
  ListReligionsResponse,
  SaveReligionRequest,
  SaveReligionResponse,
} from '@/app/api/v1/religions/types';
import type {
  GetReligionResponse,
  UpdateReligionRequest,
  UpdateReligionResponse,
} from '@/app/api/v1/religions/[id]/types';
import type {
  ListStatesResponse,
  SaveStateRequest,
  SaveStateResponse,
} from '@/app/api/v1/states/types';
import type {
  GetStateResponse,
  UpdateStateRequest,
  UpdateStateResponse,
} from '@/app/api/v1/states/[id]/types';

export type GlobalReferenceResource =
  'states' | 'countries' | 'languages' | 'religions' | 'nationalities';

type GlobalReferenceListResponse =
  | ListStatesResponse
  | ListCountriesResponse
  | ListLanguagesResponse
  | ListReligionsResponse
  | ListNationalitiesResponse;

type GlobalReferenceGetResponse =
  | GetStateResponse
  | GetCountryResponse
  | GetLanguageResponse
  | GetReligionResponse
  | GetNationalityResponse;

type GlobalReferenceSaveRequest =
  | SaveStateRequest
  | SaveCountryRequest
  | SaveLanguageRequest
  | SaveReligionRequest
  | SaveNationalityRequest;

type GlobalReferenceSaveResponse =
  | SaveStateResponse
  | SaveCountryResponse
  | SaveLanguageResponse
  | SaveReligionResponse
  | SaveNationalityResponse;

type GlobalReferenceUpdateRequest =
  | UpdateStateRequest
  | UpdateCountryRequest
  | UpdateLanguageRequest
  | UpdateReligionRequest
  | UpdateNationalityRequest;

type GlobalReferenceUpdateResponse =
  | UpdateStateResponse
  | UpdateCountryResponse
  | UpdateLanguageResponse
  | UpdateReligionResponse
  | UpdateNationalityResponse;

export type GlobalReferenceEntity = GlobalReferenceListResponse['data'][number];

export type GlobalReferenceParams = {
  page?: number;
  limit?: number;
  query?: string;
  countryId?: number;
};

export type UpdateGlobalReferenceVariables = {
  id: number;
  resource: GlobalReferenceResource;
  request: GlobalReferenceUpdateRequest;
};

export type DeleteGlobalReferenceVariables = {
  id: number;
  resource: GlobalReferenceResource;
};

export type CreateGlobalReferenceVariables = {
  resource: GlobalReferenceResource;
  request: GlobalReferenceSaveRequest;
};

export const globalReferencesQueryKey = ['global-references'] as const;

export const globalReferenceCollectionQueryKey = (resource: GlobalReferenceResource) =>
  [...globalReferencesQueryKey, resource] as const;

export const globalReferenceListQueryKey = (
  resource: GlobalReferenceResource,
  params: GlobalReferenceParams
) => [...globalReferenceCollectionQueryKey(resource), 'list', params] as const;

export const globalReferenceItemQueryKey = (resource: GlobalReferenceResource, id: number) =>
  [...globalReferenceCollectionQueryKey(resource), 'item', id] as const;

function getResourceLabel(resource: GlobalReferenceResource) {
  if (resource === 'states') return 'States';
  if (resource === 'countries') return 'Countries';
  if (resource === 'languages') return 'Languages';
  if (resource === 'religions') return 'Religions';
  return 'Nationalities';
}

function getLookupQueryKey(resource: GlobalReferenceResource) {
  if (resource === 'states') return ['states', 'list'] as const;
  if (resource === 'countries') return countriesQueryKey;
  if (resource === 'languages') return languagesQueryKey;
  if (resource === 'religions') return religionsQueryKey;
  return nationalitiesQueryKey;
}

async function fetchGlobalReferenceList(
  resource: GlobalReferenceResource,
  params: GlobalReferenceParams
): Promise<GlobalReferenceListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.countryId) searchParams.set('countryId', String(params.countryId));

  const queryString = searchParams.toString();
  const response = await fetch(`/api/v1/${resource}${queryString ? `?${queryString}` : ''}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, `Could not load ${getResourceLabel(resource)}`);
  }

  return response.json() as Promise<GlobalReferenceListResponse>;
}

async function fetchGlobalReferenceItem(
  resource: GlobalReferenceResource,
  id: number
): Promise<GlobalReferenceGetResponse> {
  const response = await fetch(`/api/v1/${resource}/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, `Could not load ${getResourceLabel(resource)}`);
  }

  return response.json() as Promise<GlobalReferenceGetResponse>;
}

async function createGlobalReference({
  resource,
  request,
}: CreateGlobalReferenceVariables): Promise<GlobalReferenceSaveResponse> {
  const response = await fetch(`/api/v1/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, `Could not create ${getResourceLabel(resource)}`);
  }

  return response.json() as Promise<GlobalReferenceSaveResponse>;
}

async function updateGlobalReference({
  id,
  resource,
  request,
}: UpdateGlobalReferenceVariables): Promise<GlobalReferenceUpdateResponse> {
  const response = await fetch(`/api/v1/${resource}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, `Could not update ${getResourceLabel(resource)}`);
  }

  return response.json() as Promise<GlobalReferenceUpdateResponse>;
}

async function deleteGlobalReference({
  id,
  resource,
}: DeleteGlobalReferenceVariables): Promise<void> {
  const response = await fetch(`/api/v1/${resource}/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, `Could not delete ${getResourceLabel(resource)}`);
  }
}

export function useGlobalReferenceListQuery(
  resource: GlobalReferenceResource,
  params: GlobalReferenceParams
) {
  return useQuery({
    queryKey: globalReferenceListQueryKey(resource, params),
    queryFn: () => fetchGlobalReferenceList(resource, params),
  });
}

export function useGlobalReferenceItemQuery(resource: GlobalReferenceResource, id: number | null) {
  return useQuery({
    queryKey:
      id === null
        ? [...globalReferenceCollectionQueryKey(resource), 'item', 'none']
        : globalReferenceItemQueryKey(resource, id),
    queryFn: () => fetchGlobalReferenceItem(resource, id as number),
    enabled: id !== null,
    select: (response) => response.data,
  });
}

export function useCreateGlobalReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGlobalReference,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: globalReferenceCollectionQueryKey(variables.resource),
      });
      void queryClient.invalidateQueries({ queryKey: getLookupQueryKey(variables.resource) });
    },
  });
}

export function useUpdateGlobalReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGlobalReference,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: globalReferenceCollectionQueryKey(variables.resource),
      });
      void queryClient.invalidateQueries({
        queryKey: globalReferenceItemQueryKey(variables.resource, variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: getLookupQueryKey(variables.resource) });
    },
  });
}

export function useDeleteGlobalReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGlobalReference,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: globalReferenceCollectionQueryKey(variables.resource),
      });
      void queryClient.invalidateQueries({
        queryKey: globalReferenceItemQueryKey(variables.resource, variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: getLookupQueryKey(variables.resource) });
    },
  });
}
