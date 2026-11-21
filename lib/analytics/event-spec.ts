// The building blocks of the Analytics Event catalogue. Each property declares the only kind of
// value it may carry, and the guard drops any value that does not fit: a free-text string can never
// pass as an enum value or a code, and a number can never carry a fraction or a sign it should not.

type BaseSpec = { readonly optional?: true };

type BooleanSpec = BaseSpec & { readonly kind: 'boolean' };
/** A whole number that is never negative: counts and durations. */
type CountSpec = BaseSpec & { readonly kind: 'count' };
/** A whole number that may be negative, such as minutes early or late against a booked start. */
type OffsetSpec = BaseSpec & { readonly kind: 'offset' };
/** An HTTP status code. */
type StatusSpec = BaseSpec & { readonly kind: 'status' };
type EnumSpec<V extends readonly string[] = readonly string[]> = BaseSpec & {
  readonly kind: 'enum';
  readonly values: V;
};
type EnumListSpec<V extends readonly string[] = readonly string[]> = BaseSpec & {
  readonly kind: 'enumList';
  readonly values: V;
};
/** A Master code, Role code or system identifier: letters, digits and `_ . : / -`, no spaces. */
type CodeSpec = BaseSpec & { readonly kind: 'code' };
type CodeListSpec = BaseSpec & { readonly kind: 'codeList' };
/** A cleaned page or API pattern such as `/patients/:id`. */
type RouteSpec = BaseSpec & { readonly kind: 'route' };
/** A fixed display label from app configuration (a page title) or a Tenant display detail. */
type LabelSpec = BaseSpec & { readonly kind: 'label' };
type TimestampSpec = BaseSpec & { readonly kind: 'timestamp' };

export type PropertySpec =
  | BooleanSpec
  | CountSpec
  | OffsetSpec
  | StatusSpec
  | EnumSpec
  | EnumListSpec
  | CodeSpec
  | CodeListSpec
  | RouteSpec
  | LabelSpec
  | TimestampSpec;

export type PropertySpecs = Readonly<Record<string, PropertySpec>>;

export type EventSpec = {
  /** Who records the event. The browser never records a `server` event, and the reverse. */
  readonly source: 'client' | 'server';
  readonly properties: PropertySpecs;
};

export const prop = {
  boolean: (): BooleanSpec => ({ kind: 'boolean' }),
  count: (): CountSpec => ({ kind: 'count' }),
  offset: (): OffsetSpec => ({ kind: 'offset' }),
  status: (): StatusSpec => ({ kind: 'status' }),
  code: (): CodeSpec => ({ kind: 'code' }),
  route: (): RouteSpec => ({ kind: 'route' }),
  label: (): LabelSpec => ({ kind: 'label' }),
  codeList: (): CodeListSpec => ({ kind: 'codeList' }),
  timestamp: (): TimestampSpec => ({ kind: 'timestamp' }),
  enum: <const V extends readonly string[]>(values: V): EnumSpec<V> => ({ kind: 'enum', values }),
  enumList: <const V extends readonly string[]>(values: V): EnumListSpec<V> => ({
    kind: 'enumList',
    values,
  }),
  optional: <S extends PropertySpec>(spec: S): S & { readonly optional: true } => ({
    ...spec,
    optional: true,
  }),
};

type ValueOf<S> = S extends BooleanSpec
  ? boolean
  : S extends CountSpec | OffsetSpec | StatusSpec
    ? number
    : S extends EnumSpec<infer V>
      ? V[number]
      : S extends EnumListSpec<infer V>
        ? readonly V[number][]
        : S extends CodeListSpec
          ? readonly string[]
          : S extends CodeSpec | RouteSpec | LabelSpec | TimestampSpec
            ? string
            : never;

type RequiredKeys<P> = { [K in keyof P]: P[K] extends { optional: true } ? never : K }[keyof P];
type OptionalKeys<P> = Exclude<keyof P, RequiredKeys<P>>;

/** The properties an event of this spec takes; optional ones may be left out or `null`. */
export type PropertiesOf<P extends PropertySpecs> = {
  -readonly [K in RequiredKeys<P>]: ValueOf<P[K]>;
} & {
  -readonly [K in OptionalKeys<P>]?: ValueOf<P[K]> | null;
};

const CODE = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,63}$/;
const ROUTE = /^\/[A-Za-z0-9_.:/-]{0,199}$/;
const LABEL_MAX_LENGTH = 200;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function wholeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;
}

/**
 * Returns the value in the form it may be sent, or `undefined` when it does not fit the spec and
 * must be dropped. Counts are rounded and never negative; codes and enum values are exact.
 */
export function coercePropertyValue(spec: PropertySpec, value: unknown): unknown {
  switch (spec.kind) {
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined;
    case 'count': {
      const number = wholeNumber(value);
      return number === undefined ? undefined : Math.max(0, number);
    }
    case 'offset':
      return wholeNumber(value);
    case 'status': {
      const number = wholeNumber(value);
      return number !== undefined && number >= 100 && number <= 599 ? number : undefined;
    }
    case 'enum':
      return typeof value === 'string' && spec.values.includes(value) ? value : undefined;
    case 'enumList':
      return Array.isArray(value) &&
        value.every((item) => typeof item === 'string' && spec.values.includes(item))
        ? [...value]
        : undefined;
    case 'code':
      return typeof value === 'string' && CODE.test(value) ? value : undefined;
    case 'codeList':
      return Array.isArray(value) &&
        value.every((item) => typeof item === 'string' && CODE.test(item))
        ? [...value]
        : undefined;
    case 'route':
      return typeof value === 'string' && ROUTE.test(value) && !/\/\d+(?:\/|$)/.test(value)
        ? value
        : undefined;
    case 'label':
      return typeof value === 'string' && value.length > 0 && value.length <= LABEL_MAX_LENGTH
        ? value
        : undefined;
    case 'timestamp':
      return typeof value === 'string' && ISO_TIMESTAMP.test(value) ? value : undefined;
  }
}

/** Keeps only the declared properties whose values fit their spec. */
export function pickDeclaredProperties(
  specs: PropertySpecs,
  properties: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(properties)) {
    const spec = specs[name];

    if (!spec || value === undefined || value === null) {
      continue;
    }

    const coerced = coercePropertyValue(spec, value);

    if (coerced !== undefined) {
      picked[name] = coerced;
    }
  }

  return picked;
}
