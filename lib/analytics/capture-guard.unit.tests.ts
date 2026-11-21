import { describe, expect, it } from 'vitest';

import { guardCapture, type GuardedCapture } from './capture-guard';

function capture(overrides: Partial<GuardedCapture>): GuardedCapture {
  return { event: '$pageview', properties: {}, ...overrides };
}

describe('guardCapture', () => {
  it('should drop an event that is not in the catalogue', () => {
    expect(guardCapture(capture({ event: '$autocapture' }))).toBeNull();
    expect(guardCapture(capture({ event: '$rageclick' }))).toBeNull();
    expect(guardCapture(capture({ event: 'patient_viewed' }))).toBeNull();
  });

  it('should clean the page view of /patients/42?q=anything', () => {
    const guarded = guardCapture(
      capture({
        properties: {
          distinct_id: 'user_1',
          token: 'phc_test',
          title: 'Asha Nair · Medical EMR',
          is_demo_page: false,
          $current_url: 'https://emr.example.com/patients/42?q=anything',
          $pathname: '/patients/42',
          $referrer: 'https://emr.example.com/patients?q=anything',
          $host: 'emr.example.com',
          $browser: 'Chrome',
        },
      }),
      { route: '/patients/:id', page_title: 'Patients', page_group: 'Clinical' }
    );

    expect(guarded?.properties).toEqual({
      distinct_id: 'user_1',
      token: 'phc_test',
      is_demo_page: false,
      route: '/patients/:id',
      page_title: 'Patients',
      page_group: 'Clinical',
      $current_url: 'https://emr.example.com/patients/:id',
      $pathname: '/patients/:id',
      $referrer: 'https://emr.example.com/patients',
      $host: 'emr.example.com',
      $browser: 'Chrome',
    });
    expect(JSON.stringify(guarded)).not.toMatch(/42|anything/);
  });

  it('should clean the initial address and referrer kept on the person', () => {
    const guarded = guardCapture(
      capture({
        $set_once: {
          $initial_current_url: 'https://emr.example.com/login?next=%2Fpatients%2F42',
          $initial_referrer: 'https://emr.example.com/patients/42?q=Asha',
          $initial_pathname: '/patients/42',
        },
      })
    );

    expect(guarded?.$set_once).toEqual({
      $initial_current_url: 'https://emr.example.com/login',
      $initial_referrer: 'https://emr.example.com/patients/:id',
      $initial_pathname: '/patients/:id',
    });
  });

  it('should keep only the declared person properties on identify', () => {
    const guarded = guardCapture(
      capture({
        event: '$identify',
        properties: { distinct_id: 'user_1', $anon_distinct_id: 'anon_1' },
        $set: {
          role_codes: ['DOCTOR'],
          membership_role: 'member',
          is_tenant_admin: false,
          has_staff_profile: true,
          tenant_id: 'tenant_1',
          tenant_slug: 'apollo',
          name: 'Dr Asha Nair',
          email: 'asha@example.com',
        },
      })
    );

    expect(guarded?.properties).toEqual({ distinct_id: 'user_1', $anon_distinct_id: 'anon_1' });
    expect(guarded?.$set).toEqual({
      role_codes: ['DOCTOR'],
      membership_role: 'member',
      is_tenant_admin: false,
      has_staff_profile: true,
      tenant_id: 'tenant_1',
      tenant_slug: 'apollo',
    });
  });

  it('should keep only the declared Tenant group properties', () => {
    const guarded = guardCapture(
      capture({
        event: '$groupidentify',
        properties: {
          $group_type: 'tenant',
          $group_key: 'tenant_1',
          $group_set: { name: 'Apollo Hospitals', slug: 'apollo', owner_email: 'o@example.com' },
        },
      })
    );

    expect(guarded?.properties.$group_set).toEqual({ name: 'Apollo Hospitals', slug: 'apollo' });
  });

  it('should drop SDK properties that copy page content', () => {
    const guarded = guardCapture(
      capture({
        properties: {
          is_demo_page: false,
          $el_text: 'Asha Nair',
          $elements_chain: 'button:text="Asha"',
          $exception_list: [],
        },
      })
    );

    expect(guarded?.properties).toEqual({ is_demo_page: false });
  });

  it('should drop a declared property whose value does not fit', () => {
    const guarded = guardCapture(
      capture({ event: 'signed_out', properties: { trigger: 'Asha typed this' } })
    );

    expect(guarded?.properties).toEqual({});
  });
});
