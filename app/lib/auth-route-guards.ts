export const DEFAULT_AUTH_REDIRECT_PATH = '/dashboard';

const PUBLIC_PAGE_PATHS = new Set(['/', '/login', '/signup', '/swagger']);
const AUTH_PAGE_PATHS = new Set(['/login', '/signup']);
const STATIC_FILE_PATTERN =
  /\.(?:avif|bmp|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|xml)$/i;
const SAME_SITE_ORIGIN = 'https://emr.local';

function normalizePathname(pathname: string) {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isPathSegmentOrChild(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`);
}

export function isPublicPagePath(pathname: string) {
  return PUBLIC_PAGE_PATHS.has(normalizePathname(pathname));
}

function isAuthPagePath(pathname: string) {
  return AUTH_PAGE_PATHS.has(normalizePathname(pathname));
}

function isInternalPath(pathname: string) {
  return isPathSegmentOrChild(pathname, '/api') || isPathSegmentOrChild(pathname, '/_next');
}

function isStaticFilePath(pathname: string) {
  return STATIC_FILE_PATTERN.test(pathname) || pathname === '/favicon.ico';
}

function getFirstParam(value: unknown) {
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string');
  }

  return typeof value === 'string' ? value : undefined;
}

export function getSafeNextPath(
  value: unknown,
  fallback: string = DEFAULT_AUTH_REDIRECT_PATH
): string {
  const nextPath = getFirstParam(value);

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallback;
  }

  if (nextPath.includes('\\')) {
    return fallback;
  }

  try {
    const nextUrl = new URL(nextPath, SAME_SITE_ORIGIN);

    if (nextUrl.origin !== SAME_SITE_ORIGIN) {
      return fallback;
    }

    const pathname = normalizePathname(nextUrl.pathname);

    if (isAuthPagePath(pathname) || isInternalPath(pathname) || isStaticFilePath(pathname)) {
      return fallback;
    }

    return `${pathname}${nextUrl.search}`;
  } catch {
    return fallback;
  }
}
