import { describe, expect, it } from 'vitest';

import { visitEditHref } from './visit-edit-href';

const allowed = { canUpdate: true, canAmend: true };
const denied = { canUpdate: false, canAmend: false };

describe('visitEditHref', () => {
  it('should edit an active Visit in place on its page', () => {
    expect(visitEditHref({ id: 7, status: 'CHECKED_IN' }, allowed)).toBe('/visits/7');
    expect(visitEditHref({ id: 7, status: 'IN_CONSULTATION' }, allowed)).toBe('/visits/7');
  });

  it('should open the Amend sheet for a Completed Visit', () => {
    expect(visitEditHref({ id: 7, status: 'COMPLETED' }, allowed)).toBe('/visits/7?capture=amend');
  });

  it('should not offer Edit for a Cancelled Visit', () => {
    expect(visitEditHref({ id: 7, status: 'CANCELLED' }, allowed)).toBeNull();
  });

  it('should not offer Edit without the matching permission', () => {
    expect(visitEditHref({ id: 7, status: 'IN_CONSULTATION' }, denied)).toBeNull();
    expect(visitEditHref({ id: 7, status: 'COMPLETED' }, denied)).toBeNull();
    expect(
      visitEditHref({ id: 7, status: 'COMPLETED' }, { canUpdate: true, canAmend: false })
    ).toBeNull();
  });
});
