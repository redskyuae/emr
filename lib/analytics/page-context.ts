import { isPublicPagePath } from '@/app/lib/auth-route-guards';
import { getAppPageGroup, getAppPageMeta } from '@/components/app/app-shell-config';
import type { CapturePageContext } from '@/lib/analytics/capture-guard';
import { cleanPath } from '@/lib/analytics/clean-address';

/** The static-data pages behind `ENABLE_DEMO_PAGES`, as cleaned routes. */
const DEMO_ROUTES = new Set(['/visit-list', '/billing-counter', '/visits/:id/assessment']);

/** Paths that render outside the app shell, so they have no page title or group. */
function isOutsideAppShell(pathname: string) {
  return isPublicPagePath(pathname) || pathname === '/onboarding';
}

/** The cleaned route, plus the app shell's page title and group for pages inside the shell. */
export function buildPageContext(pathname: string): CapturePageContext {
  const route = cleanPath(pathname);

  if (isOutsideAppShell(pathname)) {
    return { route };
  }

  return {
    route,
    page_title: getAppPageMeta(pathname).title,
    page_group: getAppPageGroup(pathname),
  };
}

export function isDemoRoute(pathname: string) {
  return DEMO_ROUTES.has(cleanPath(pathname));
}
