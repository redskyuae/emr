import { describe, expect, it } from 'vitest';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import {
  findVisitChargeItem,
  isFreeFollowUpCharge,
  listVisitChargeItems,
  suggestedVisitChargeKind,
  visitChargePrice,
  VISIT_CHARGE_OPTIONS,
} from './visit-charge-options';

const item = (
  id: number,
  code: string,
  name: string,
  category: ChargeItem['category'] = 'CONSULTATION',
  isActive = true
) => ({ id, code, name, category, isActive, unitPrice: id * 100 }) as ChargeItem;

describe('Visit Charge Item choices', () => {
  it('keeps the four workflow choices fixed', () => {
    expect(VISIT_CHARGE_OPTIONS.map((option) => option.value)).toEqual([
      'NEW_CONSULTATION',
      'ESTABLISHED_CONSULTATION',
      'FOLLOW_UP_CONSULTATION',
      'TREATMENT_SESSION',
    ]);
  });

  it('suggests from VisitType and Visit Patient Type', () => {
    expect(suggestedVisitChargeKind('OPD', 'NEW')).toBe('NEW_CONSULTATION');
    expect(suggestedVisitChargeKind('OPD', 'ESTABLISHED')).toBe('ESTABLISHED_CONSULTATION');
    expect(suggestedVisitChargeKind('FUP', 'ESTABLISHED')).toBe('FOLLOW_UP_CONSULTATION');
    expect(suggestedVisitChargeKind('PROC', 'NEW')).toBe('TREATMENT_SESSION');
    expect(suggestedVisitChargeKind('EMER', 'NEW')).toBeNull();
  });

  it('matches configured active Charge Items by workflow code or name', () => {
    const items = [
      item(1, 'CONS_NEW', 'Initial Doctor Visit'),
      item(2, 'CONS_EST', 'Returning Doctor Visit'),
      item(3, 'FUP', 'Review Visit'),
      item(4, 'TREAT_SESSION', 'Therapy', 'PROCEDURE'),
    ];
    expect(findVisitChargeItem(items, 'NEW_CONSULTATION')?.id).toBe(1);
    expect(findVisitChargeItem(items, 'ESTABLISHED_CONSULTATION')?.id).toBe(2);
    expect(findVisitChargeItem(items, 'FOLLOW_UP_CONSULTATION')?.id).toBe(3);
    expect(findVisitChargeItem(items, 'TREATMENT_SESSION')?.id).toBe(4);
    expect(
      findVisitChargeItem([item(5, 'X', 'Follow-up Doctor Visit')], 'FOLLOW_UP_CONSULTATION')?.id
    ).toBe(5);
  });

  it('never maps a workflow choice to an inactive or wrong-category Charge Item', () => {
    expect(
      findVisitChargeItem(
        [item(1, 'FUP', 'Follow-up', 'CONSULTATION', false)],
        'FOLLOW_UP_CONSULTATION'
      )
    ).toBeNull();
    expect(
      findVisitChargeItem(
        [item(2, 'TREAT_SESSION', 'Therapy', 'CONSULTATION')],
        'TREATMENT_SESSION'
      )
    ).toBeNull();
    expect(
      findVisitChargeItem([item(3, 'CONS', 'General Consultation')], 'NEW_CONSULTATION')
    ).toBeNull();
  });

  it('offers all coded levels explicitly and uses the cash price after the effective date', () => {
    const levels = [
      {
        ...item(1, '99212', 'Established Patient Level Two'),
        visitChargeKind: 'ESTABLISHED_CONSULTATION',
        effectiveDate: '2026-01-01',
        cashPrice: 90,
      },
      {
        ...item(2, '99213', 'Established Patient Level Three'),
        visitChargeKind: 'ESTABLISHED_CONSULTATION',
        effectiveDate: '2027-01-01',
        cashPrice: 120,
      },
    ] as ChargeItem[];
    expect(
      listVisitChargeItems(levels, 'ESTABLISHED_CONSULTATION', '2026-10-26').map(
        (service) => service.code
      )
    ).toEqual(['99212']);
    expect(listVisitChargeItems(levels, 'ESTABLISHED_CONSULTATION', '2027-10-26')).toHaveLength(2);
    expect(visitChargePrice(levels[0])).toBe(90);
  });

  it('waives only a recent follow-up for a flagged established service', () => {
    const service = {
      ...item(1, '99213', 'Established Patient Level Three'),
      freeFollowUpEligible: true,
    } as ChargeItem;
    expect(isFreeFollowUpCharge(service, 'FUP', true)).toBe(true);
    expect(isFreeFollowUpCharge(service, 'OPD', true)).toBe(false);
    expect(isFreeFollowUpCharge(service, 'FUP', false)).toBe(false);
  });
});
