// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, Fragment, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import type { ChargeItem } from '@/app/api/lib/modules/charge-item/schemas/charge-item-schema';
import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { VisitBillingFields } from './visit-billing-fields';

const followUpCharge = {
  id: 4,
  name: 'Follow-up Consultation',
  code: 'FUP',
  category: 'CONSULTATION',
  isActive: true,
  unitPrice: 200,
} as ChargeItem;

function Form({
  chargeItems = [followUpCharge],
  hasRecentDoctorVisit = false,
}: {
  chargeItems?: ChargeItem[];
  hasRecentDoctorVisit?: boolean;
}) {
  const [visitTypeCode, setVisitTypeCode] = useState<'FUP' | 'OPD'>('FUP');
  const form = useForm<CreateVisitFormValues>({
    defaultValues: {
      mode: 'walk-in',
      appointmentId: '',
      patientId: '1',
      doctorId: '2',
      visitTypeId: '3',
      chiefComplaint: '',
      remarks: '',
      createInvoice: false,
      paymentTiming: 'LATER',
      paymentClassification: 'SELF_PAY',
      insurer: '',
      policyReference: '',
      chargeKind: '',
      chargeItemId: '',
      chargeAmount: '',
      amountReceived: '0',
      paymentMethod: 'CASH',
      paymentReference: '',
    },
  });
  const chargeItemId = useWatch({ control: form.control, name: 'chargeItemId' });
  const amountReceived = useWatch({ control: form.control, name: 'amountReceived' });

  return createElement(
    Fragment,
    null,
    createElement(VisitBillingFields, {
      control: form.control,
      errors: form.formState.errors,
      setValue: form.setValue,
      chargeItems,
      canBill: true,
      canCollectPayment: true,
      visitTypeCode,
      patientType: 'ESTABLISHED',
      visitDate: '2026-10-26',
      hasRecentDoctorVisit,
      loading: false,
      error: false,
      onRetry: () => {},
    }),
    createElement('output', { 'data-testid': 'charge-item-id' }, chargeItemId),
    createElement('output', { 'data-testid': 'amount-received' }, amountReceived),
    createElement(
      'button',
      { type: 'button', onClick: () => setVisitTypeCode('OPD') },
      'Change to OPD'
    )
  );
}

afterEach(cleanup);

describe('Visit Billing', () => {
  it('prefills the follow-up Charge Item and makes Pay now or later explicit', async () => {
    const user = userEvent.setup();
    render(createElement(Form));
    await user.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByTestId('charge-item-id').textContent).toBe('4'));
    expect(screen.queryByRole('option', { name: 'Set up in Billing Masters' })).toBeNull();
    const chargeItemSelect = screen.getByLabelText(/Charge Item/) as HTMLSelectElement;
    expect(chargeItemSelect.options).toHaveLength(2);
    expect(chargeItemSelect.querySelectorAll('optgroup')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /FUP · Follow-up Consultation/ })).toBeTruthy();
    expect((screen.getByLabelText(/Visit charge/) as HTMLInputElement).value).toBe('200');

    await user.selectOptions(screen.getByLabelText('Payment timing'), 'NOW');
    expect((screen.getByLabelText('Amount received') as HTMLInputElement).value).toBe('200');
    expect(screen.getByTestId('amount-received').textContent).toBe('200');

    await user.selectOptions(screen.getByLabelText('Payment timing'), 'LATER');
    expect(screen.queryByLabelText('Amount received')).toBeNull();
    expect(screen.getByTestId('amount-received').textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Change to OPD' }));
    await waitFor(() => expect(screen.getByTestId('charge-item-id').textContent).toBe(''));
  });

  it('requires staff to choose a coded consultation level and uses its Cash Price', async () => {
    const user = userEvent.setup();
    const levels = [
      {
        ...followUpCharge,
        id: 12,
        code: '99212',
        name: 'Established Patient Level Two',
        visitChargeKind: 'ESTABLISHED_CONSULTATION',
        cashPrice: 90,
      },
      {
        ...followUpCharge,
        id: 13,
        code: '99213',
        name: 'Established Patient Level Three',
        visitChargeKind: 'ESTABLISHED_CONSULTATION',
        cashPrice: 120,
        insuranceContractPrice: 80,
      },
    ] as ChargeItem[];
    render(createElement(Form, { chargeItems: levels }));
    await user.click(screen.getByRole('button', { name: 'Change to OPD' }));
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('charge-item-id').textContent).toBe('');
    await user.selectOptions(screen.getByLabelText(/Charge Item/), '13');
    expect(screen.getByTestId('charge-item-id').textContent).toBe('13');
    expect((screen.getByLabelText(/Visit charge/) as HTMLInputElement).value).toBe('120');
    await user.selectOptions(screen.getByLabelText(/Payment classification/), 'REIMBURSEMENT');
    expect((screen.getByLabelText(/Visit charge/) as HTMLInputElement).value).toBe('120');
  });

  it('suggests zero only for an eligible recent follow-up', async () => {
    const user = userEvent.setup();
    render(
      createElement(Form, {
        chargeItems: [{ ...followUpCharge, freeFollowUpEligible: true }],
        hasRecentDoctorVisit: true,
      })
    );
    await user.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.getByTestId('charge-item-id').textContent).toBe('4'));
    expect(screen.getByRole('option', { name: /Follow-up Consultation · 0\.00/ })).toBeTruthy();
    expect((screen.getByLabelText(/Visit charge/) as HTMLInputElement).value).toBe('0');
    expect(screen.getByText(/Eligible follow-up within 7 days/)).toBeTruthy();
  });

  it('waives an eligible established CPT service when used on a qualifying follow-up Visit', async () => {
    const user = userEvent.setup();
    render(
      createElement(Form, {
        chargeItems: [
          {
            ...followUpCharge,
            id: 13,
            code: '99213',
            name: 'Established Patient Level Three',
            visitChargeKind: 'ESTABLISHED_CONSULTATION',
            freeFollowUpEligible: true,
            cashPrice: 120,
          } as ChargeItem,
        ],
        hasRecentDoctorVisit: true,
      })
    );
    await user.click(screen.getByRole('checkbox'));
    await user.selectOptions(screen.getByLabelText(/Charge Item/), '13');
    expect((screen.getByLabelText(/Visit charge/) as HTMLInputElement).value).toBe('0');
  });
});
