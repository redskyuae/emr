# Billing Counter — workflow and MOM validation

Branch `rakesh/feat-clinician-visit-billing-counter`. The Billing Counter (`/billing-counter`) and the
Visit List (`/visit-list`) are **front-end demos on static data**: nothing is persisted and no API is
called. Their calculation rules live in pure, unit-tested modules under
`app/(protected)/billing-counter/_utils/`, so they can move behind the API unchanged.

Both pages, and the Clinician assessment at `/visits/[id]/assessment`, return 404 and stay out of the
sidebar unless `ENABLE_DEMO_PAGES=true`. Keep the flag off in production.

The existing `/billing` Invoice module (API-backed, Draft → Finalize → Pay) is untouched.

## End-to-end workflow

```
Open shift ─▶ Check-in (Visit List) ─▶ Invoice ─▶ Receipt ─▶ Day book ─▶ Day close ─▶ Handover
                                   └─▶ Advance / deposit ─┐        ▲
                                   └─▶ Refund (credit note)┴────────┘
```

1. **Open shift** — the cashier opens a shift on a Counter with an opening float. The default
   (AED 1,000.00) needs no approval; any other amount needs an authorizing supervisor.
2. **Find the Visit** — the Visit List filters by date range, Doctor, status, Visit Type, source
   (Appointment / Walk-in), Patient type (New / Established), billing status and free text (Visit
   Number, MRN, name, phone, booking number, invoice number). **Bill** opens the counter with the
   Patient and Visit preselected (`/billing-counter?visit=VST-1026`).
3. **Invoice** — add Charge Items (service or CPT code). Each line has quantity, discount percentage (0–100%), VAT rate
   and, for insured Patients, a Bill-to of Patient or Insurer. Totals are gross − discount =
   taxable, + VAT = total. A discount needs a reason (and approval above 10%); insured lines need
   the insurer's approval number. The Patient pays the Patient share; the Insurer share is billed to the
   payer.
4. **Pay** — split across Cash, Card, UPI, Google Pay, Bank transfer, Cheque, Other and Advance (see Payment methods). Partial
   payments are allowed if the balance is explicitly left outstanding. Cash is applied last and
   excess handed over is returned as change; only the applied amount is posted.
5. **Receipt** — Tax Invoice & Receipt with invoice number, receipt number, paid amount, method,
   remaining advance and any outstanding balance. Print, Email PDF, Send by WhatsApp.
6. **Advance / deposit** — credited to the Patient's advance account, VAT-inclusive with the VAT
   portion shown. Later Invoices draw it down automatically (the cashier can switch this off).
7. **Refund** — issues a Credit Note against the unused advance balance or a paid Invoice. Needs a
   reason and an approver. Refund to Cash, Bank transfer, or the original card, UPI or Google Pay
   the Patient paid with.
8. **Day book** — Transaction, Cash, Bank and Sales books for the current shift.
9. **Day close** — reconcile cash and card against the system, explain variances, close the shift
   and post to the ledger. The summary gives the amount retained as the next float and the deposit to
   the safe.
10. **Next shift** — opens with a fresh ledger; closed shifts stay listed on Day close.

## Payment methods

Every method records what an auditor or reconciler needs, and each reconciles against a different
source. The catalogue is `TENDER_META` in `_utils/tender.ts`.

| Method        | Details captured                                                | Reconciled against  |
| ------------- | --------------------------------------------------------------- | ------------------- |
| Cash          | Amount handed over; change is calculated and never posted       | Cash drawer         |
| Card          | Card type, network, last 4 digits\*, approval code\*            | Card terminal batch |
| UPI           | UPI ID (optional, `name@bank`), UTR / transaction ID\*          | Bank                |
| Google Pay    | Transaction ID\*                                                | Bank                |
| Bank transfer | Transfer reference\*, remitting bank                            | Bank                |
| Cheque        | Cheque number\*, drawee bank\*, cheque date\*                   | Bank                |
| Other         | Payment description\*, reference (for example a gift voucher)   | Day close breakdown |
| Advance       | Drawn from the Patient's advance balance; applied automatically | Advance account     |

\* required. Day close shows collections, refunds and net **by method**, and the Bank book shows
each instrument's details. `COUNTER_ENABLED_METHODS` in `_data/counter-seed.ts` switches methods on
or off per Counter, for a Facility that does not take UPI or Google Pay.

## Business rules enforced

| Rule                                                                                                                       | Where                  |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Line total = (qty × unit − discount%) + VAT on the discounted amount                                                       | `invoice-calc.ts`      |
| Discount is a percentage between 0% and 100%; quantity is a whole number ≥ 1                                               | `validateInvoiceLines` |
| Registered medicines carry 0% VAT; services 5%                                                                             | Charge Item `vatRate`  |
| Card, transfer, cheque, Google Pay and Advance cannot together exceed the amount due                                       | `validateTenders`      |
| Cash only covers what the other tenders leave; excess is change, never posted                                              | `resolveTenders`       |
| Card approval code, cheque number and bank, transfer reference, Google Pay ID required                                     | `validateTenders`      |
| Advance is applied automatically (up to balance and amount due; can be switched off); manual use cannot exceed the balance | `validateTenders`      |
| Balance must be collected or explicitly left outstanding                                                                   | `validateTenders`      |
| Refund ≤ refundable; reason and approver mandatory; cash refund ≤ drawer cash                                              | `validateRefund`       |
| Invoice refunds return only money tendered, not advance applied                                                            | `refundableOf`         |
| Advance refunds and receipts split VAT-inclusive amounts at 5%                                                             | `splitVatInclusive`    |
| Any discount needs a reason; a discount above 10% on any line needs supervisor approval                                    | `validateDiscount`     |
| Lines billed to the insurer need an insurer approval number to claim                                                       | `validatePayerAuth`    |
| Non-default opening float needs an authorizer                                                                              | `validateOpening`      |
| Expected cash = opening float + cash received − cash refunds                                                               | `computeCashDrawer`    |
| Any variance needs a reason; above AED 50 it needs supervisor approval                                                     | `validateClose`        |
| A closed shift cannot post until the next shift is opened                                                                  | Counter workspace      |

## MOM validation

| #   | MOM point                                             | Status      | Notes                                                                                                                                                    |
| --- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Billing by service / CPT code                         | Built       | Charge Items carry code, optional CPT, price and VAT rate. **Needs the Charge Item Master** (point 10) to hold VAT rate and CPT code.                    |
| 2   | Payment methods, partial and full                     | Built       | Screenshots showed only Cash, Card, Advance. UPI, Google Pay, Bank transfer, Cheque and Other added, each with its own required details.                 |
| 3   | Receipts                                              | Built       | Screenshots had no receipt number. Added `AUH-RCP-…` alongside the invoice number. Print works; WhatsApp and email are simulated.                        |
| 4   | Advance payments                                      | Built       | Balance drawn down automatically on the next Invoice (up to the amount due); every posting records its transaction type (Invoice, Advance, Credit note). |
| 5   | Refunds, cash and bank, mandatory reason and approval | Built       | Screenshots offered Cash only. Bank transfer added, and card, UPI or Google Pay refunds go back to the original instrument.                              |
| 6   | Day book: transaction, cash, bank, sales              | Partly      | The four books are built. **Expenses are not**: no screen or data source exists. They need Accounts Payable / petty cash.                                |
| 7   | Opening balance per counter/shift                     | Built       | The screenshots showed an open shift but no way to open one. Default or authorized amount.                                                               |
| 8   | Day closing                                           | Built       | Collections, advances, refunds, outstanding, handover. Shift handover is a summary, not a signed hand-off.                                               |
| 9   | Cash reconciliation                                   | Built       | Counted vs expected, with variance reason and supervisor approval.                                                                                       |
| 10  | Charge Item Master                                    | In progress | Demo uses a static catalogue. Master must supply code, CPT, price, VAT rate and whether the item is insurer-coverable.                                   |

| Action item          | Covered by                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| 1 Opening balance    | Shift open panel and `validateOpening`                                     |
| 2 Day closing        | Day close tab: KPIs, reconciliation, outstanding list, handover            |
| 3 Advance deductions | Advance tender, balance tracking, `counter-ledger.unit.tests.ts`           |
| 4 Refund management  | Refund tab, credit note with VAT adjustment, approval                      |
| 5 Day book reports   | Four books; expenses outstanding                                           |
| 6 Billing review     | Partial payment, discount, VAT, methods and receipt all exercised in tests |

## Findings in the reviewed screens

1. **Advance balance does not reconcile.** Ms. Anna Petrova: advance AED 30,000.00 less credit note
   AED 4,000.00 is AED 26,000.00, but the screens show AED 27,000.00 both before and after the
   refund. The refundable amount was not reduced by the refund. The demo derives balances from the
   ledger, so refundable always equals advances less refunds.
2. **Change is correctly excluded from the ledger.** Cash received 1,500.00 on a 1,034.00 invoice
   posts 1,034.00. Retained as the rule.
3. **Day-close figures are internally consistent** and the seed reproduces them exactly: cash
   36,503.00; card 2,306.60; advances received 36,000.00; payers 1,079.40; refunds 4,000.00;
   expected drawer cash 33,503.00. These are asserted in `counter-ledger.unit.tests.ts`.
4. **Advance VAT math checks out**: 4,000.00 = 3,809.52 + 190.48 at 5%.
5. **Queue Tokens were not per Doctor in check-in order** in the first Visit List draft; they are
   now derived by Doctor and day, as defined in `CONTEXT.md`.

## Conflicts with `CONTEXT.md` that need a decision

The screens and MOM go beyond the current glossary. None of this is implemented in the API, and
`CONTEXT.md` has not been edited.

| Glossary today                                   | Counter demo / MOM                                 |
| ------------------------------------------------ | -------------------------------------------------- |
| Discount is a flat Invoice-level amount          | Per-line discount                                  |
| Cash / self-pay only, insurance not modeled      | Insurer share, claims via Shafafiya                |
| Payment methods include UPI                      | Google Pay                                         |
| Invoice lifecycle Draft → Finalized → Paid       | Counter posts Invoice and receipt in one step      |
| Payments are append-only, sum ≤ grand total      | Consistent: applied amount posted, change returned |
| No Advance, Credit Note, Shift, or Day Book term | All required                                       |

Proposed glossary additions: **Counter**, **Shift**, **Opening Float**, **Tender**, **Advance**,
**Credit Note**, **Day Book**, **Variance**.

## Open questions for the business

1. Default opening float and the variance threshold needing a supervisor (demo: AED 1,000 and AED 50).
2. Who may approve refunds and float overrides, and whether approval needs a PIN.
3. Refunds of insurer-paid Invoices (not modeled).
4. Whether expenses and supplier payments belong in this Day Book or in Accounts Payable.
5. VAT: confirm 5% for wellness services, 0% for registered medicines, and the VAT-inclusive
   treatment of advances with the tax agent (the screen itself carries this caveat).
6. Which methods each Facility enables (UPI is not in common use in the UAE), and whether post-dated cheques count as collected before they clear.
7. Whether Day close posts to a general ledger and which chart-of-accounts mapping applies.

## Try it

| Patient (MRN)               | Visit    | Good for                                        |
| --------------------------- | -------- | ----------------------------------------------- |
| Mrs. Priya Nair (AYU000110) | VST-1026 | The screenshot Invoice; advance AED 3,000       |
| Mr. Khalid Al Nuaimi        | VST-1022 | Insured Patient, Bill-to per line               |
| Ms. Anna Petrova            | VST-1024 | Refund of unused advance (AED 26,000)           |
| Ms. Deepa Menon             | VST-1021 | Paying a completed, unbilled Visit from advance |
| Mr. Mohammed Al Hashemi     | none     | Counter sale with no Visit; advance AED 500     |

**Reset demo data** in the counter header restores the seeded shift.
