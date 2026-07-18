# Payments Are Append-Only With Transactional Status Sync

A Payment, once recorded, is never updated or deleted — there is no PATCH or DELETE route for payments. A Payment is a financial record; the only way to reverse the effect of one is to void the Invoice (legal only when no Payment exists) or, in a future refunds plan, to record a compensating entry. This keeps the audit trail honest and sidesteps the entire class of "edit a payment and desync the invoice total" bugs.

The Invoice's `amountPaid` is denormalized (rather than summed from payments at read time) so that status filtering and Balance Due reads stay cheap. It is maintained in the _same_ guarded `UPDATE` that flips the status, inside the transaction that inserts the Payment row:

```
UPDATE invoice
SET amount_paid = amount_paid + $amount,
    status = CASE WHEN amount_paid + $amount >= grand_total THEN 'PAID'
                  ELSE 'PARTIALLY_PAID' END
WHERE id = $id AND tenant_id = $tenant
  AND status IN ('FINALIZED', 'PARTIALLY_PAID')
  AND amount_paid + $amount <= grand_total
```

Because the balance check and the write are one statement, the overpay race has no window: two concurrent payments that would each individually fit but together overshoot cannot both succeed — the second sees the first's committed `amount_paid` and its `WHERE` fails, yielding zero rows, which the command maps to a clean "amount exceeds balance" error and rolls back the inserted Payment. A table CHECK `amount_paid <= grand_total` is the last-resort backstop.

Payment Method is a fixed set (ADR 0036). `receivedAt` may be supplied by the client (defaulting to now) so hospitals can backfill end-of-day cash entries; it may not be in the future.
