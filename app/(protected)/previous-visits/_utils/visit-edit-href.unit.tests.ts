import { describe, expect, it } from 'vitest';

import { visitEditHref } from './visit-edit-href';

const allowed = { canAmend: true };
const denied = { canAmend: false };

describe('visitEditHref', () => {
  it('should open the Amend sheet for a Completed Visit', () => {
    expect(visitEditHref({ id: 7, status: 'COMPLETED' }, allowed)).toBe('/visits/7?capture=amend');
  });

  it('should not offer Edit for an active Visit, which View Visit already opens', () => {
    expect(visitEditHref({ id: 7, status: 'CHECKED_IN' }, allowed)).toBeNull();
    expect(visitEditHref({ id: 7, status: 'IN_CONSULTATION' }, allowed)).toBeNull();
  });

  it('should not offer Edit for a Cancelled Visit', () => {
    expect(visitEditHref({ id: 7, status: 'CANCELLED' }, allowed)).toBeNull();
  });

  it('should not offer Edit without the Amend permission', () => {
    expect(visitEditHref({ id: 7, status: 'COMPLETED' }, denied)).toBeNull();
  });
});
