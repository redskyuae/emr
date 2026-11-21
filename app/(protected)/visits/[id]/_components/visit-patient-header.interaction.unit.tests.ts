// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement, type ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import { VisitPatientHeader } from './visit-patient-header';

function visit(overrides: Partial<Visit> = {}) {
  return {
    id: 7,
    queueToken: 3,
    status: 'CHECKED_IN',
    visitNumber: 'VST-1007',
    patient: { id: 3, firstName: 'Asha', lastName: 'Rao', mrn: 'MRN-0003' },
    doctor: { id: 2, name: 'Dr. Iyer' },
    visitType: { id: 1, name: 'OPD Consultation', code: 'OPD' },
    appointment: null,
    admitSource: null,
    ...overrides,
  } as unknown as Visit;
}

function renderHeader(value: Visit) {
  const noop = vi.fn();
  const props: ComponentProps<typeof VisitPatientHeader> = {
    visit: value,
    allergyCount: null,
    canStart: false,
    canComplete: false,
    canCancel: false,
    canCreateInvoice: false,
    canRecordVitals: false,
    canCreateNote: false,
    canAssignPlan: false,
    canBookAppointment: false,
    canAmend: false,
    starting: false,
    onStart: noop,
    onAmend: noop,
    onComplete: noop,
    onCancel: noop,
    onRecordVitals: noop,
    onAddNote: noop,
    onAddAllergy: noop,
    onAddMedication: noop,
    onAssignPlan: noop,
    onOpenDocuments: noop,
  };

  render(createElement(VisitPatientHeader, props));
}

afterEach(cleanup);

describe('Visit patient header', () => {
  it('should show the Admit Source after the booking number', () => {
    renderHeader(visit({ admitSource: { id: 4, name: 'Referral', code: 'REF' } }));

    expect(screen.getByText(/Walk-in · Referral/)).toBeTruthy();
  });

  it('should leave the Admit Source out when the Visit has none', () => {
    renderHeader(visit());

    expect(screen.getByText(/OPD Consultation · Dr\. Iyer · Walk-in$/)).toBeTruthy();
  });
});
