type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export function getSetCookies(headers?: Headers) {
  if (!headers) {
    return [];
  }

  const setCookies = (headers as HeadersWithSetCookie).getSetCookie?.();

  if (setCookies && setCookies.length > 0) {
    return setCookies;
  }

  const setCookie = headers.get('set-cookie');

  if (!setCookie) {
    return [];
  }

  // A combined `set-cookie` header joins multiple cookies with commas. Split on
  // the comma that precedes a new `name=value` pair so cookies whose attributes
  // contain commas (e.g. `Expires`) are not torn apart.
  return setCookie
    .split(/,(?=\s*[^;=,\s]+=[^;,]+)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

export function createCookieHeader(setCookies: string[]) {
  return setCookies
    .map((setCookie) => setCookie.split(';', 1)[0]?.trim() ?? '')
    .filter(Boolean)
    .join('; ');
}
