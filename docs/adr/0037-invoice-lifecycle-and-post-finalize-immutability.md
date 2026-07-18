# Invoice Lifecycle Is a Fixed Set; Finalized Invoices Are Immutable

Invoice Status is a fixed system-defined set of five values — `DRAFT`, `FINALIZED`, `PARTIALLY_PAID`, `PAID`, `VOID` — stored as a checked column, following the Visit/Admission Status reasoning (ADR 0027, ADR 0035): the lifecycle drives hard rules (what may be edited, whether a Payment is accepted, whether a Void is legal) and gains nothing from Tenant-editable indirection.

Legal transitions, each its own command:

- `DRAFT → FINALIZED` — finalize; requires at least one Line. A zero-total Invoice finalizes straight to `PAID` (supports free camps/charity cases without a fake Payment row).
- `DRAFT → VOID` and `FINALIZED → VOID` — void; legal only when no Payment has been recorded; requires a reason.
- `FINALIZED → PARTIALLY_PAID → PAID` — driven by the Payment command, never set by hand (ADR 0039).

`PARTIALLY_PAID` is a **stored** status, flipped transactionally by the Payment command, not derived at read time — this keeps status filtering and indexing straightforward. Balance Due, by contrast, is always derived (grand total − amount paid), never stored.

Finalized Invoices are immutable except for recording Payments and voiding. All Line, Discount, and notes edits are `DRAFT`-only. This is enforced in two places: validators reject the operation with a clean message, and the repository's guarded `UPDATE`/`INSERT` carries a `status = 'DRAFT'` predicate so a concurrent finalize cannot slip an edit through — zero affected rows map to a clean "not a draft" outcome, mirroring the guarded bed-occupy pattern in the admission module.

**Discount clamp on Line removal.** Removing a Line can drop the subtotal below the current Discount, which the `discount_amount <= subtotal` CHECK would reject. Rather than block the removal (which strands a Draft behind a Discount the user must hunt down), the remove-line transaction clamps `discount_amount = min(discount_amount, new_subtotal)` in the same statement and the response surfaces the adjusted totals.
