import { describe, expect, it } from 'vitest';

import { openedSurfaces, SURFACE_NAMES, SURFACES_BY_ROUTE } from './surfaces';

const params = (query: string) => new URLSearchParams(query);

describe('openedSurfaces', () => {
  it('should record the Role sheet for an existing Role as edit, without its id', () => {
    expect(openedSurfaces('/identity-access/roles', params(''), params('role=42'))).toEqual([
      { surface: 'role', mode: 'edit' },
    ]);
  });

  it('should record a sheet opened with new as create', () => {
    expect(
      openedSurfaces('/billing-masters/charge-items', params(''), params('charge-item=new'))
    ).toEqual([{ surface: 'charge-item', mode: 'create' }]);
    expect(openedSurfaces('/admissions', params('status=ALL'), params('admit=new'))).toEqual([
      { surface: 'admit', mode: 'create' },
    ]);
  });

  it('should count a sheet that is open when the page loads', () => {
    expect(openedSurfaces('/rooms', null, params('room=7'))).toEqual([
      { surface: 'room', mode: 'edit' },
    ]);
  });

  it('should not count a sheet again while it stays open', () => {
    expect(openedSurfaces('/rooms', params('room=new'), params('room=new'))).toEqual([]);
    expect(openedSurfaces('/rooms', params('room=new'), params('room=12'))).toEqual([]);
  });

  it('should treat the same parameter by what it means on each page', () => {
    expect(openedSurfaces('/identity-access/users', params(''), params('role=3'))).toEqual([]);
    expect(openedSurfaces('/appointments', params(''), params('doctor=3&status=2'))).toEqual([]);
    expect(openedSurfaces('/doctors', params(''), params('doctor=3'))).toEqual([
      { surface: 'doctor', mode: 'edit' },
    ]);
    expect(
      openedSurfaces('/asset-management-masters/statuses', params(''), params('status=new'))
    ).toEqual([{ surface: 'asset-status', mode: 'create' }]);
    expect(openedSurfaces('/appointment-masters/reasons', params(''), params('reason=1'))).toEqual([
      { surface: 'appointment-reason', mode: 'edit' },
    ]);
    expect(
      openedSurfaces('/appointment-masters/cancelled-reasons', params(''), params('reason=1'))
    ).toEqual([{ surface: 'cancelled-reason', mode: 'edit' }]);
  });

  it('should ignore filters, tabs, steps and paging', () => {
    expect(
      openedSurfaces('/patients/:id', params(''), params('tab=timeline&feed=billing'))
    ).toEqual([]);
    expect(openedSurfaces('/visits/:id', params(''), params('step=vitals'))).toEqual([]);
    expect(openedSurfaces('/patients', params(''), params('q=asha&page=2&gender=female'))).toEqual(
      []
    );
  });

  it('should return nothing on a page without surfaces', () => {
    expect(openedSurfaces('/dashboard', null, params('role=new'))).toEqual([]);
  });

  it('should record view and delete surfaces for an existing record', () => {
    expect(openedSurfaces('/appointments', params(''), params('appointment=55'))).toEqual([
      { surface: 'appointment', mode: 'view' },
    ]);
    expect(openedSurfaces('/billing/:id', params(''), params('receipt=9'))).toEqual([
      { surface: 'payment-receipt', mode: 'view' },
    ]);
    expect(
      openedSurfaces('/global-references/states', params(''), params('stateDelete=4'))
    ).toEqual([{ surface: 'state', mode: 'delete' }]);
  });

  it('should ignore a create-only surface opened with a record id', () => {
    expect(openedSurfaces('/admissions', params(''), params('admit=12'))).toEqual([]);
    expect(openedSurfaces('/appointments', params(''), params('appointment=new'))).toEqual([]);
  });

  it('should name a capture sheet by its value and count a switch to another one', () => {
    expect(openedSurfaces('/visits/:id', params(''), params('capture=vitals'))).toEqual([
      { surface: 'capture-vitals', mode: 'create' },
    ]);
    expect(
      openedSurfaces('/visits/:id', params('capture=vitals'), params('capture=nurse-note'))
    ).toEqual([{ surface: 'capture-nurse-note', mode: 'create' }]);
    expect(openedSurfaces('/admissions/:id', params(''), params('capture=note'))).toEqual([
      { surface: 'capture-note', mode: 'create' },
    ]);
  });

  it('should leave the Complete Visit dialog and unknown capture values out', () => {
    expect(openedSurfaces('/visits/:id', params(''), params('capture=complete'))).toEqual([]);
    expect(openedSurfaces('/visits/:id', params(''), params('capture=toString'))).toEqual([]);
  });

  it('should record every surface that opened in the same change', () => {
    expect(
      openedSurfaces('/global-references/nationalities', params(''), params('nationality=new'))
    ).toEqual([{ surface: 'nationality', mode: 'create' }]);
    expect(openedSurfaces('/visits/:id', params(''), params('capture=amend&amendNote=3'))).toEqual([
      { surface: 'amend-visit', mode: 'edit' },
      { surface: 'amend-note', mode: 'edit' },
    ]);
  });
});

describe('SURFACES_BY_ROUTE', () => {
  it('should map every declared surface name from at least one page', () => {
    const mapped = new Set<string>();

    for (const rules of Object.values(SURFACES_BY_ROUTE)) {
      for (const rule of Object.values(rules)) {
        if (rule.kind === 'values') {
          Object.values(rule.values).forEach(({ surface }) => mapped.add(surface));
        } else {
          mapped.add(rule.surface);
        }
      }
    }

    expect([...SURFACE_NAMES].filter((name) => !mapped.has(name))).toEqual([]);
  });

  it('should key pages by their cleaned route', () => {
    for (const route of Object.keys(SURFACES_BY_ROUTE)) {
      expect(route).toMatch(/^(\/(?:[a-z][a-z-]*|:id))+$/);
    }
  });
});
