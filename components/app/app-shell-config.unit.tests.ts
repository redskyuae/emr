import { describe, expect, it } from 'vitest';

import { appNavGroups, getAppPageMeta, getVisibleNavGroups } from './app-shell-config';

function getVisibleGroup(groupTitle: string, permissions: string[]) {
  return getVisibleNavGroups(appNavGroups, permissions).find(({ title }) => title === groupTitle);
}

function getVisibleParent(groupTitle: string, parentTitle: string, permissions: string[]) {
  return getVisibleGroup(groupTitle, permissions)?.items.find(({ title }) => title === parentTitle);
}

describe('App shell navigation permissions', () => {
  it('should show Asset Management menus only for their matching resource permissions', () => {
    expect(getVisibleGroup('Asset Management', [])).toBeUndefined();
    expect(
      getVisibleGroup('Asset Management', ['asset:read'])?.items.map(({ title }) => title)
    ).toEqual(['Overview', 'Inventory']);
    expect(
      getVisibleGroup('Asset Management', ['work-order:read'])?.items.map(({ title }) => title)
    ).toEqual(['Maintenance']);
    expect(
      getVisibleGroup('Asset Management', ['asset:read', 'work-order:read'])?.items.map(
        ({ title }) => title
      )
    ).toEqual(['Overview', 'Inventory', 'Maintenance']);
  });

  it('should show each Asset Management Master for its matching resource permission', () => {
    expect(getVisibleParent('Configuration', 'Asset Management', [])).toBeUndefined();
    expect(
      getVisibleParent('Configuration', 'Asset Management', [
        'asset-category:read',
        'asset-condition:read',
        'asset-status:read',
        'work-order-type:read',
        'work-order-priority:read',
        'work-order-status:read',
      ])?.items?.map(({ title }) => title)
    ).toEqual([
      'Categories',
      'Conditions',
      'Status',
      'Work Order Type',
      'Work Order Priority',
      'Work Order Status',
    ]);
  });

  it('should gate Appointment, Room, and Doctor Scheduling menus by resource', () => {
    expect(getVisibleGroup('Clinical', [])).toBeUndefined();
    expect(getVisibleGroup('Operations', [])).toBeUndefined();
    expect(
      getVisibleGroup('Clinical', ['appointment:read'])?.items.map(({ title }) => title)
    ).toEqual(['Appointments', 'Book Appointment']);
    expect(
      getVisibleGroup('Operations', ['room:read', 'doctor-schedule:read'])?.items.map(
        ({ title }) => title
      )
    ).toEqual(['Rooms', 'Doctor Schedules']);
  });

  it('should gate Doctor Rota and Room Type configuration menus by resource', () => {
    expect(getVisibleParent('Configuration', 'Rota Management', [])).toBeUndefined();
    expect(getVisibleParent('Configuration', 'Room Masters', [])).toBeUndefined();
    expect(getVisibleParent('Configuration', 'Rota Management', ['doctor-rota:read'])?.title).toBe(
      'Rota Management'
    );
    expect(
      getVisibleParent('Configuration', 'Room Masters', ['room-type:read'])?.items?.map(
        ({ title }) => title
      )
    ).toEqual(['Room Type']);
  });

  it('should gate Sessions by its existing permission resource', () => {
    expect(getVisibleGroup('Identity & Access', [])).toBeUndefined();
    expect(
      getVisibleGroup('Identity & Access', ['session:read'])?.items.map(({ title }) => title)
    ).toEqual(['Sessions']);
  });

  it('should describe the Asset Conditions page exposed by navigation', () => {
    expect(getAppPageMeta('/asset-management-masters/conditions')).toEqual({
      title: 'Asset Conditions',
      subtitle: 'Tenant-scoped physical condition records for Assets.',
    });
  });
});
