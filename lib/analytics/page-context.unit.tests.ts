import { describe, expect, it } from 'vitest';

import { buildPageContext, isDemoRoute } from './page-context';

describe('buildPageContext', () => {
  it('should give app pages a cleaned route, title and group', () => {
    const context = buildPageContext('/patients/42');

    expect(context.route).toBe('/patients/:id');
    expect(context.page_title).toEqual(expect.any(String));
  });

  it('should give pages outside the app shell only a route', () => {
    expect(buildPageContext('/login')).toEqual({ route: '/login' });
    expect(buildPageContext('/onboarding')).toEqual({ route: '/onboarding' });
  });
});

describe('isDemoRoute', () => {
  it('should recognise the demo pages', () => {
    expect(isDemoRoute('/visit-list')).toBe(true);
    expect(isDemoRoute('/visits/7/assessment')).toBe(true);
    expect(isDemoRoute('/visits/7')).toBe(false);
  });
});
