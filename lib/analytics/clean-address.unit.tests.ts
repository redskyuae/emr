import { describe, expect, it } from 'vitest';

import { cleanPath, cleanUrl, looksLikeAddress } from './clean-address';

describe('cleanPath', () => {
  it.each([
    ['/patients/42', '/patients/:id'],
    ['/patients/42/edit', '/patients/:id/edit'],
    ['/visits/7', '/visits/:id'],
    ['/visits/7/assessment', '/visits/:id/assessment'],
    ['/visits/7/summary', '/visits/:id/summary'],
    ['/admissions/15', '/admissions/:id'],
    ['/billing/901', '/billing/:id'],
    ['/appointments/33/reschedule', '/appointments/:id/reschedule'],
    ['/assets-management/inventory/5', '/assets-management/inventory/:id'],
    [
      '/api/v1/patients/42/treatment-plans/3/sessions/9/start',
      '/api/v1/patients/:id/treatment-plans/:id/sessions/:id/start',
    ],
  ])('should replace the record id in %s', (path, expected) => {
    expect(cleanPath(path)).toBe(expected);
  });

  it('should replace a percent-encoded record id', () => {
    expect(cleanPath('/patients/%34%32')).toBe('/patients/:id');
    expect(cleanPath('/patients/%34%32/edit')).toBe('/patients/:id/edit');
  });

  it('should keep a segment with a malformed escape without throwing', () => {
    expect(cleanPath('/patients/%E0%A4%A')).toBe('/patients/%E0%A4%A');
  });

  it('should replace a UUID segment', () => {
    expect(cleanPath('/things/3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe('/things/:id');
  });

  it('should replace a BetterAuth user id segment', () => {
    expect(cleanPath('/audit-log/users/Xk3mP9qL2vR8tY5wZ1nB6cD4fG7hJ0sA')).toBe(
      '/audit-log/users/:id'
    );
    expect(cleanPath('/api/v1/audit-log/users/Xk3mP9qL2vR8tY5wZ1nB6cD4fG7hJ0sA/export')).toBe(
      '/api/v1/audit-log/users/:id/export'
    );
  });

  it('should keep word segments, however long', () => {
    expect(cleanPath('/audit-log/users')).toBe('/audit-log/users');
    expect(cleanPath('/appointment-masters/appointment-cancelled-reason')).toBe(
      '/appointment-masters/appointment-cancelled-reason'
    );
    expect(cleanPath('/reports/consolidated-patient-report')).toBe(
      '/reports/consolidated-patient-report'
    );
    // 32 characters but hyphenated, as page names are.
    expect(cleanPath('/x/appointment-cancelled-reason-xyz')).toBe(
      '/x/appointment-cancelled-reason-xyz'
    );
    // 31 and 33 characters: only an exact 32-character id is a BetterAuth id.
    expect(cleanPath('/x/abcdefghijklmnopqrstuvwxyzABCDE')).toBe(
      '/x/abcdefghijklmnopqrstuvwxyzABCDE'
    );
    expect(cleanPath('/x/abcdefghijklmnopqrstuvwxyzABCDEFG')).toBe(
      '/x/abcdefghijklmnopqrstuvwxyzABCDEFG'
    );
  });

  it('should drop the query string and fragment', () => {
    expect(cleanPath('/patients?q=Asha%20Nair&page=2')).toBe('/patients');
    expect(cleanPath('/reports/consolidated?patient=42&from=2026-01-01')).toBe(
      '/reports/consolidated'
    );
    expect(cleanPath('/billing?patientId=42&visitId=7&admissionId=3')).toBe('/billing');
    expect(cleanPath('/visits/new?appointmentId=12')).toBe('/visits/new');
    expect(cleanPath('/patients/42#notes')).toBe('/patients/:id');
  });

  it('should drop the next address on the login page', () => {
    expect(cleanPath('/login?next=%2Fpatients%2F42%3Fq%3DAsha')).toBe('/login');
  });

  it('should keep segments that are not ids', () => {
    expect(cleanPath('/appointments/new')).toBe('/appointments/new');
    expect(cleanPath('/visits/types')).toBe('/visits/types');
    expect(cleanPath('/')).toBe('/');
  });
});

describe('cleanUrl', () => {
  it('should keep the origin and clean the path', () => {
    expect(cleanUrl('https://emr.example.com/patients/42?q=anything')).toBe(
      'https://emr.example.com/patients/:id'
    );
  });

  it('should clean a bare path', () => {
    expect(cleanUrl('/patients/42?q=anything')).toBe('/patients/:id');
  });

  it('should drop a value that cannot be parsed', () => {
    expect(cleanUrl('not a url 42')).toBe('');
  });
});

describe('looksLikeAddress', () => {
  it('should recognise absolute addresses and paths only', () => {
    expect(looksLikeAddress('https://emr.example.com/x')).toBe(true);
    expect(looksLikeAddress('/patients/42')).toBe(true);
    expect(looksLikeAddress('$direct')).toBe(false);
    expect(looksLikeAddress('Chrome')).toBe(false);
  });
});
