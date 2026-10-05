import { describe, expect, it } from 'vitest';

import { appNavGroups, getAppPageMeta, getVisibleNavGroups } from './app-shell-config';

function getVisibleGroup(groupTitle: string, permissions: string[]) {
  return getVisibleNavGroups(appNavGroups, permissions).find(({ title }) => title === groupTitle);
}

function getVisibleParent(groupTitle: string, parentTitle: string, permissions: string[]) {
  return getVisibleGroup(groupTitle, permissions)?.items.find(({ title }) => title === parentTitle);
}

describe('App shell navigation permissions', () => {
  it('should show only Appointment booking modules and masters when the sidebar flag is on', () => {
    const permissions = [
      'patient:read',
      'appointment:read',
      'room:read',
      'doctor:read',
      'therapist:read',
      'doctor-schedule:read',
      'therapist-schedule:read',
      'doctor-rota:read',
      'appointment-mode:read',
      'appointment-type:read',
      'appointment-status:read',
      'appointment-reason:read',
      'appointment-cancelled-reason:read',
      'room-type:read',
      'therapist-skill:read',
      'asset:read',
      'invoice:read',
      'visit:read',
    ];

    const groups = getVisibleNavGroups(appNavGroups, permissions, true);

    expect(groups.map(({ title }) => title)).toEqual([
      'Overview',
      'Clinical',
      'Operations',
      'Configuration',
    ]);
    expect(groups[0].items.map(({ title }) => title)).toEqual(['Dashboard']);
    expect(groups[1].items.map(({ title }) => title)).toEqual([
      'Patients',
      'Appointments',
      'Book Appointment',
    ]);
    expect(groups[2].items.map(({ title }) => title)).toEqual([
      'Rooms',
      'Doctors',
      'Therapists',
      'Doctor Schedules',
      'Therapist Schedules',
    ]);
    expect(groups[3].items.map(({ title }) => title)).toEqual([
      'Rota Management',
      'Appointment Masters',
      'Room Masters',
      'Clinical Masters',
    ]);
    expect(
      groups[3].items.find(({ title }) => title === 'Appointment Masters')?.items
    ).toHaveLength(5);
    expect(
      groups[3].items
        .find(({ title }) => title === 'Room Masters')
        ?.items?.map(({ title }) => title)
    ).toEqual(['Room Type']);
    expect(
      groups[3].items
        .find(({ title }) => title === 'Clinical Masters')
        ?.items?.map(({ title }) => title)
    ).toEqual(['Therapist Skills']);
  });

  it('should preserve permission filtering in the reduced sidebar', () => {
    const groups = getVisibleNavGroups(appNavGroups, ['appointment:read'], true);

    expect(groups.map(({ title }) => title)).toEqual(['Overview', 'Clinical']);
    expect(groups[1].items.map(({ title }) => title)).toEqual(['Appointments', 'Book Appointment']);
  });

  it('should restore the full sidebar when the flag is off', () => {
    const permissions = ['appointment:read', 'asset:read'];

    expect(getVisibleNavGroups(appNavGroups, permissions, false)).toEqual(
      getVisibleNavGroups(appNavGroups, permissions)
    );
    expect(
      getVisibleNavGroups(appNavGroups, permissions, false).map(({ title }) => title)
    ).toContain('Asset Management');
  });

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

  it('should gate Appointment, Room, Doctor, and Therapist Scheduling menus by resource', () => {
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
    expect(
      getVisibleGroup('Operations', ['doctor-schedule:read', 'therapist-schedule:read'])?.items.map(
        ({ title }) => title
      )
    ).toEqual(['Doctor Schedules', 'Therapist Schedules']);
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
