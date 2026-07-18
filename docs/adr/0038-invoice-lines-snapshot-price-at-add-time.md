# Invoice Lines Snapshot Description and Price at Add Time

An Invoice Line copies its `description` and `unitPrice` from the source Charge Item at the moment it is added, rather than referencing the Charge Item's live price. The Charge Item is kept only as a nullable provenance FK (`chargeItemId`), and Bed-Day Charge lines carry no Charge Item at all.

This follows how OpenEMR's Fee Sheet and Bahmni/Odoo quotations behave: a bill is a record of what was charged at the time it was charged. If Lines referenced the live Charge Item price, a Master price edit would silently rewrite the totals of every historical Invoice — including finalized and paid ones — which is both wrong accounting and a reconciliation nightmare.

Consequences:

- The cashier may override the unit price and set the quantity when adding a Line; after that the Line is add/remove only (no in-place edit — remove and re-add). An in-place quantity/price PATCH is a cheap follow-up if cashiers want it.
- Retiring a Charge Item is `isActive = false`, and deleting one never corrupts an Invoice, because every Line already holds its own description and price. Charge Item therefore needs no delete guard.
- `amount = round2(quantity × unitPrice)` is computed per Line and stored; the Invoice subtotal is the sum of the stored Line amounts, so totals are stable regardless of later rounding-rule changes.
