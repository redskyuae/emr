import { describe, expect, it } from 'vitest';

import {
  appNavGroups,
  getAppPageGroup,
  getAppPageMeta,
  getVisibleNavGroups,
} from './app-shell-config';

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

  it('shows Charge Items under Billing Masters in the reduced sidebar when permitted', () => {
    const permitted = getVisibleNavGroups(appNavGroups, ['charge-item:read'], true);
    const configuration = permitted.find(({ title }) => title === 'Configuration');

    expect(configuration?.items.find(({ title }) => title === 'Billing Masters')?.items).toEqual([
      {
        title: 'Charge Items',
        href: '/billing-masters/charge-items',
        permission: 'charge-item',
      },
    ]);
    const withoutPermission = getVisibleNavGroups(appNavGroups, ['appointment:read'], true);
    expect(
      withoutPermission
        .find(({ title }) => title === 'Configuration')
        ?.items.some(({ title }) => title === 'Billing Masters') ?? false
    ).toBe(false);
  });

  it('should show Visits in the reduced sidebar only when enabled and permitted', () => {
    const permissions = ['appointment:read', 'visit:read'];

    const enabledGroups = getVisibleNavGroups(appNavGroups, permissions, true, true, true);
    expect(enabledGroups.map(({ title }) => title)).toEqual(['Overview', 'Clinical', 'Outpatient']);
    expect(enabledGroups[2].items.map(({ title }) => title)).toEqual([
      'Visits',
      'Previous Visits',
      'Reports',
      'Visit List',
    ]);

    expect(getVisibleNavGroups(appNavGroups, permissions, true, false)).not.toContainEqual(
      expect.objectContaining({ title: 'Outpatient' })
    );
    expect(getVisibleNavGroups(appNavGroups, ['appointment:read'], true, true)).not.toContainEqual(
      expect.objectContaining({ title: 'Outpatient' })
    );
  });

  it('should hide the static demo pages unless demo pages are enabled', () => {
    const permissions = ['visit:read', 'invoice:read'];
    const titles = (showDemoPages: boolean) =>
      getVisibleNavGroups(appNavGroups, permissions, false, false, showDemoPages).flatMap(
        ({ items }) => items.map(({ title }) => title)
      );

    expect(titles(false)).toEqual(
      expect.arrayContaining(['Visits', 'Previous Visits', 'Invoices'])
    );
    expect(titles(false)).not.toContain('Visit List');
    expect(titles(false)).not.toContain('Billing Counter');
    expect(titles(true)).toEqual(expect.arrayContaining(['Visit List', 'Billing Counter']));
  });

  it('should show Reports below Previous Visits only with Visit permission', () => {
    const outpatientTitles = (
      permissions: string[],
      appointmentsOnly: boolean,
      showVisits: boolean
    ) =>
      getVisibleNavGroups(appNavGroups, permissions, appointmentsOnly, showVisits, true)
        .find(({ title }) => title === 'Outpatient')
        ?.items.map(({ title }) => title) ?? [];

    expect(outpatientTitles(['visit:read'], false, false)).toEqual([
      'Visits',
      'Previous Visits',
      'Reports',
      'Visit List',
    ]);
    expect(outpatientTitles(['appointment:read'], false, false)).not.toContain('Reports');
    expect(outpatientTitles(['visit:read'], true, false)).not.toContain('Reports');
    expect(outpatientTitles(['visit:read'], true, true)).toContain('Reports');
  });

  it('should show Reports with Visit permission whether or not demo pages are enabled', () => {
    const outpatientTitles = (
      permissions: string[],
      appointmentsOnly: boolean,
      showVisits: boolean
    ) =>
      getVisibleNavGroups(appNavGroups, permissions, appointmentsOnly, showVisits, false)
        .find(({ title }) => title === 'Outpatient')
        ?.items.map(({ title }) => title) ?? [];

    expect(outpatientTitles(['visit:read'], false, false)).toEqual([
      'Visits',
      'Previous Visits',
      'Reports',
    ]);
    expect(outpatientTitles(['visit:read'], true, true)).toEqual([
      'Visits',
      'Previous Visits',
      'Reports',
    ]);
    expect(outpatientTitles(['visit:read'], true, false)).toEqual([]);
    expect(outpatientTitles(['appointment:read'], false, false)).toEqual([]);
  });

  it('should describe the Reports page and place it in Outpatient', () => {
    expect(getAppPageMeta('/reports')).toEqual({
      title: 'Reports',
      subtitle: 'Generate Outpatient reports for a date range or a month.',
    });
    expect(getAppPageGroup('/reports')).toBe('Outpatient');
  });

  it('should describe the Consolidated Patient Report page and place it in Outpatient', () => {
    expect(getAppPageMeta('/reports/consolidated')).toEqual({
      title: 'Consolidated Patient Report',
      subtitle: "One Patient's diagnoses, Treatment Plans and Visit-wise progress over a period.",
    });
    expect(getAppPageGroup('/reports/consolidated')).toBe('Outpatient');
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

  it('should list ICD-10-CM and Ayurveda Diagnosis Codes under Clinical Masters by resource', () => {
    expect(getVisibleParent('Configuration', 'Clinical Masters', [])).toBeUndefined();
    expect(
      getVisibleParent('Configuration', 'Clinical Masters', [
        'diagnosis-code:read',
        'ayurveda-diagnosis-code:read',
      ])?.items
    ).toEqual([
      {
        title: 'ICD-10-CM Diagnosis Codes',
        href: '/clinical-masters/diagnosis-codes',
        permission: 'diagnosis-code',
      },
      {
        title: 'Ayurveda Diagnosis Codes',
        href: '/clinical-masters/ayurveda-diagnosis-codes',
        permission: 'ayurveda-diagnosis-code',
      },
    ]);
    expect(
      getVisibleParent('Configuration', 'Clinical Masters', [
        'ayurveda-diagnosis-code:read',
      ])?.items?.map(({ title }) => title)
    ).toEqual(['Ayurveda Diagnosis Codes']);
  });

  it('should keep both Diagnosis Code masters out of the reduced sidebar, like before', () => {
    const groups = getVisibleNavGroups(
      appNavGroups,
      ['diagnosis-code:read', 'ayurveda-diagnosis-code:read', 'therapist-skill:read'],
      true
    );

    expect(
      groups
        .find(({ title }) => title === 'Configuration')
        ?.items.find(({ title }) => title === 'Clinical Masters')
        ?.items?.map(({ title }) => title)
    ).toEqual(['Therapist Skills']);
  });

  it('should describe the Ayurveda Diagnosis Codes page with a permission-gated add action', () => {
    expect(getAppPageMeta('/clinical-masters/ayurveda-diagnosis-codes')).toEqual({
      title: 'Ayurveda Diagnosis Codes',
      subtitle: 'Tenant-scoped Ayurveda diagnosis catalogue, mapped to ICD-10-CM for claims.',
      primaryAction: {
        label: 'Add Ayurveda Diagnosis Code',
        href: '/clinical-masters/ayurveda-diagnosis-codes?ayurvedaCode=new',
        permission: 'ayurveda-diagnosis-code:create',
      },
    });
    expect(getAppPageMeta('/clinical-masters/diagnosis-codes').title).toBe(
      'ICD-10-CM Diagnosis Codes'
    );
  });

  it('should describe the Asset Conditions page exposed by navigation', () => {
    expect(getAppPageMeta('/asset-management-masters/conditions')).toEqual({
      title: 'Asset Conditions',
      subtitle: 'Tenant-scoped physical condition records for Assets.',
    });
  });

  it('should title the Visit Summary page after its own task', () => {
    expect(getAppPageMeta('/visits/12/summary')).toEqual({
      title: 'Visit Summary',
      subtitle: 'Print the Patient copy of this Visit.',
    });
  });

  it('should title the Check-in and Reschedule pages after their own task', () => {
    expect(getAppPageMeta('/visits/new').title).toBe('Check in Patient');
    expect(getAppPageMeta('/appointments/7/reschedule')).toEqual({
      title: 'Reschedule Appointment',
      subtitle: 'Move a booked Appointment to another date, time, or resource.',
    });
    expect(getAppPageMeta('/appointments/7').title).toBe('Appointments');
  });

  it('should keep a Create Visit action in the header of both Visit list pages', () => {
    expect(getAppPageMeta('/visits').primaryAction?.href).toBe('/visits/new');
    expect(getAppPageMeta('/visit-list').primaryAction).toEqual({
      label: 'Create Visit',
      href: '/visits/new',
      permission: 'visit:create',
    });
  });

  it('should give a page the navigation group of the item it belongs to', () => {
    expect(getAppPageGroup('/dashboard')).toBe('Overview');
    expect(getAppPageGroup('/patients/42')).toBe('Clinical');
    expect(getAppPageGroup('/appointment-masters/modes')).toBe('Configuration');
  });

  it('should give a nested page the group of its section', () => {
    expect(getAppPageGroup('/appointments/new')).toBe('Clinical');
    expect(getAppPageGroup('/rooms/3')).toBe('Operations');
  });

  it('should have no group for a page outside the navigation', () => {
    expect(getAppPageGroup('/somewhere-else')).toBeUndefined();
  });
});
