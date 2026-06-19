import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

import { getSafeNextPath, isPublicPagePath } from '@/app/lib/auth-route-guards';

export function proxy(request: NextRequest) {
  if (isPublicPagePath(request.nextUrl.pathname) || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  const nextPath = getSafeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`, '');

  if (nextPath) {
    loginUrl.searchParams.set('next', nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next(?:/|$)|favicon.ico$|robots.txt$|sitemap.xml$|manifest.json$|.*\\.(?:avif|bmp|css|gif|ico|jpeg|jpg|js|json|map|png|svg|txt|webp|xml)$).*)',
  ],
};
