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

  return setCookie ? [setCookie] : [];
}

export function createCookieHeader(setCookies: string[]) {
  return setCookies
    .map((setCookie) => setCookie.split(';')[0])
    .filter(Boolean)
    .join('; ');
}
