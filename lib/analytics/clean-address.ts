// Page and API addresses carry Patient ids and record ids in their path, and search terms, Patient
// ids and earlier addresses in their query string. Every address that reaches PostHog goes through
// here first: id segments become `:id` and the query string and fragment are dropped.

const ID_PLACEHOLDER = ':id';
const ALL_DIGITS = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isIdSegment(segment: string) {
  return ALL_DIGITS.test(segment) || UUID.test(segment);
}

/** `/patients/42/edit?q=Asha#notes` → `/patients/:id/edit` */
export function cleanPath(path: string): string {
  const [pathname] = path.split(/[?#]/, 1);

  if (!pathname) {
    return '/';
  }

  return pathname
    .split('/')
    .map((segment) => (isIdSegment(segment) ? ID_PLACEHOLDER : segment))
    .join('/');
}

/**
 * Cleans an absolute address, keeping its origin. A value that is not an address is returned as
 * is when it is a bare path, and dropped (empty string) otherwise, so nothing unparsed slips past.
 */
export function cleanUrl(value: string): string {
  if (value.startsWith('/')) {
    return cleanPath(value);
  }

  try {
    const url = new URL(value);

    return `${url.origin}${cleanPath(url.pathname)}`;
  } catch {
    return '';
  }
}

/** True for strings that look like an address PostHog recorded, absolute or a bare path. */
export function looksLikeAddress(value: string) {
  return value.startsWith('/') || /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}
