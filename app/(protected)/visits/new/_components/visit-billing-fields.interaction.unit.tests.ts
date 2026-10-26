// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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

function Form() {
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
      chargeItems: [followUpCharge],
      canBill: true,
      canCollectPayment: true,
      visitTypeCode,
      patientType: 'ESTABLISHED',
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
    expect(within(screen.getByLabelText(/Charge Item/)).getAllByRole('option')).toHaveLength(5);
    expect(
      (screen.getByRole('option', { name: /New Patient Consultation/ }) as HTMLOptionElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole('option', { name: /Follow-up Consultation/ }) as HTMLOptionElement).disabled
    ).toBe(false);
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
});
