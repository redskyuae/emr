import type { GlobalReferenceResource } from '@/app/queries/global-references/useGlobalReferencesManagement';

export type GlobalReferenceScreenKey =
  'states' | 'countries' | 'languages' | 'religions' | 'nationalities';

export type GlobalReferenceScreenConfig = {
  resource: GlobalReferenceResource;
  route: string;
  queryParam: string;
  singularTitle: string;
  pluralTitle: string;
  lowerPlural: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  addButtonLabel: string;
  hasCode: boolean;
  hasCountry: boolean;
  namePlaceholder: string;
  codePlaceholder?: string;
};

export const globalReferenceScreens = {
  languages: {
    resource: 'languages',
    route: '/global-references/languages',
    queryParam: 'language',
    singularTitle: 'Language',
    pluralTitle: 'Languages',
    lowerPlural: 'languages',
    searchPlaceholder: 'Search languages...',
    emptyTitle: 'No Languages yet',
    emptyDescription: 'Create Languages used when recording Patient demographics.',
    addButtonLabel: 'Add Language',
    hasCode: true,
    hasCountry: false,
    namePlaceholder: 'e.g. English',
    codePlaceholder: 'e.g. EN',
  },
  nationalities: {
    resource: 'nationalities',
    route: '/global-references/nationalities',
    queryParam: 'nationality',
    singularTitle: 'Nationality',
    pluralTitle: 'Nationalities',
    lowerPlural: 'nationalities',
    searchPlaceholder: 'Search nationalities...',
    emptyTitle: 'No Nationalities yet',
    emptyDescription: 'Create Nationalities used during Patient Registration.',
    addButtonLabel: 'Add Nationality',
    hasCode: true,
    hasCountry: false,
    namePlaceholder: 'e.g. Indian',
    codePlaceholder: 'e.g. IND',
  },
  religions: {
    resource: 'religions',
    route: '/global-references/religions',
    queryParam: 'religion',
    singularTitle: 'Religion',
    pluralTitle: 'Religions',
    lowerPlural: 'religions',
    searchPlaceholder: 'Search religions...',
    emptyTitle: 'No Religions yet',
    emptyDescription: 'Create Religions used when recording Patient demographics.',
    addButtonLabel: 'Add Religion',
    hasCode: true,
    hasCountry: false,
    namePlaceholder: 'e.g. Hindu',
    codePlaceholder: 'e.g. HIN',
  },
  countries: {
    resource: 'countries',
    route: '/global-references/countries',
    queryParam: 'country',
    singularTitle: 'Country',
    pluralTitle: 'Countries',
    lowerPlural: 'countries',
    searchPlaceholder: 'Search countries...',
    emptyTitle: 'No Countries yet',
    emptyDescription: 'Create Countries used in address and identity-document context.',
    addButtonLabel: 'Add Country',
    hasCode: true,
    hasCountry: false,
    namePlaceholder: 'e.g. India',
    codePlaceholder: 'e.g. IN',
  },
  states: {
    resource: 'states',
    route: '/global-references/states',
    queryParam: 'state',
    singularTitle: 'State',
    pluralTitle: 'States',
    lowerPlural: 'states',
    searchPlaceholder: 'Search states...',
    emptyTitle: 'No States yet',
    emptyDescription: 'Create States under Countries for address context.',
    addButtonLabel: 'Add State',
    hasCode: false,
    hasCountry: true,
    namePlaceholder: 'e.g. Tamil Nadu',
  },
} satisfies Record<GlobalReferenceScreenKey, GlobalReferenceScreenConfig>;
