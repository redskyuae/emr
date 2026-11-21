import { describe, expect, it } from 'vitest';

import { INVOICE_STATUSES } from '@/app/db/schema/invoice';
import { PAYMENT_METHODS } from '@/app/db/schema/payment';
import { serverLifecycleEvents } from './server-lifecycle-events';

describe('serverLifecycleEvents', () => {
  it('should declare every lifecycle event as a server event', () => {
    for (const spec of Object.values(serverLifecycleEvents)) {
      expect(spec.source).toBe('server');
    }
  });

  it('should list exactly the Invoice Statuses of the invoice schema', () => {
    expect(serverLifecycleEvents.invoice_voided.properties.from_status.values).toEqual(
      INVOICE_STATUSES
    );
    expect(serverLifecycleEvents.invoice_finalized.properties.resulting_status.values).toEqual(
      INVOICE_STATUSES
    );
    expect(
      serverLifecycleEvents.payment_recorded.properties.resulting_invoice_status.values
    ).toEqual(INVOICE_STATUSES);
  });

  it('should list exactly the Payment Methods of the payment schema', () => {
    expect(serverLifecycleEvents.payment_recorded.properties.payment_method.values).toEqual(
      PAYMENT_METHODS
    );
  });
});
