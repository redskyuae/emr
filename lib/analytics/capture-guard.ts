// PostHog's before-send hook: the runtime backstop behind the typed capture helper. It runs on
// every event the browser SDK is about to send, including the ones the SDK builds itself
// ($pageleave, $identify, $groupidentify), and
//   - drops any event that is not in the catalogue,
//   - drops any custom property the catalogue does not declare, or whose value does not fit,
//   - cleans every address the SDK recorded (current page, referrer, the person's initial ones),
//   - drops the SDK properties that copy on-screen content.

import { cleanUrl, looksLikeAddress } from '@/lib/analytics/clean-address';
import {
  commonProperties,
  getEventSpec,
  personProperties,
  tenantGroupProperties,
} from '@/lib/analytics/catalogue';
import { pickDeclaredProperties, type PropertySpecs } from '@/lib/analytics/event-spec';

/** The parts of PostHog's `CaptureResult` the guard reads and rewrites. */
export type GuardedCapture = {
  event: string;
  properties: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
};

/** Values describing the current page, added to every client event. */
export type CapturePageContext = {
  route?: string;
  page_group?: string;
  page_title?: string;
};

/** SDK events with no catalogue entry that identity and grouping depend on. */
const IDENTITY_EVENTS = new Set(['$identify', '$groupidentify', '$set']);

/** Non-`$` properties the SDK itself adds and ingestion needs. */
const SDK_PROPERTIES = new Set(['distinct_id', 'token']);

/** SDK properties that copy page content or error text. */
const DROPPED_SDK_PROPERTY = /^\$(?:el_text|elements|elements_chain|exception|snapshot|web_vitals)/;

function cleanSdkValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return looksLikeAddress(value) ? cleanUrl(value) : value;
  }

  if (Array.isArray(value)) {
    return value.map(cleanSdkValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, cleanSdkValue(nested)])
    );
  }

  return value;
}

function splitProperties(properties: Record<string, unknown>) {
  const sdk: Record<string, unknown> = {};
  const custom: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (SDK_PROPERTIES.has(key)) {
      sdk[key] = value;
    } else if (key.startsWith('$')) {
      if (!DROPPED_SDK_PROPERTY.test(key)) {
        sdk[key] = cleanSdkValue(value);
      }
    } else {
      custom[key] = value;
    }
  }

  return { sdk, custom };
}

/** Person or group properties: the declared custom ones, plus the SDK's `$` ones, cleaned. */
function guardPropertyBag(specs: PropertySpecs, bag: Record<string, unknown> | undefined) {
  if (!bag) {
    return undefined;
  }

  const { sdk, custom } = splitProperties(bag);
  delete sdk.distinct_id;
  delete sdk.token;

  return { ...sdk, ...pickDeclaredProperties(specs, custom) };
}

export function guardCapture<T extends GuardedCapture>(
  capture: T,
  page: CapturePageContext = {}
): T | null {
  const isIdentityEvent = IDENTITY_EVENTS.has(capture.event);
  const spec = getEventSpec(capture.event);

  if (!spec && !isIdentityEvent) {
    return null;
  }

  const { sdk, custom } = splitProperties(capture.properties ?? {});
  const eventSpecs: PropertySpecs = spec
    ? { ...commonProperties, ...spec.properties }
    : commonProperties;
  const properties: Record<string, unknown> = {
    ...sdk,
    ...pickDeclaredProperties(eventSpecs, { ...page, ...custom }),
  };

  if (capture.event === '$groupidentify') {
    properties.$group_set = guardPropertyBag(
      tenantGroupProperties,
      capture.properties?.$group_set as Record<string, unknown> | undefined
    );
  }

  const guarded: T = { ...capture, properties };

  if (capture.$set) {
    guarded.$set = guardPropertyBag(personProperties, capture.$set);
  }

  if (capture.$set_once) {
    guarded.$set_once = guardPropertyBag(personProperties, capture.$set_once);
  }

  if (properties.$set && typeof properties.$set === 'object') {
    properties.$set = guardPropertyBag(
      personProperties,
      properties.$set as Record<string, unknown>
    );
  }

  if (properties.$set_once && typeof properties.$set_once === 'object') {
    properties.$set_once = guardPropertyBag(
      personProperties,
      properties.$set_once as Record<string, unknown>
    );
  }

  return guarded;
}
