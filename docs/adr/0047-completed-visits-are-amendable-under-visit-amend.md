# Completed Visits Are Amendable Under `visit:amend`

ADR 0027 made a Completed or Cancelled Visit immutable except for soft delete, and signed Clinical Notes were immutable on their own terms. In practice, staff reviewing Previous Visits find errors after completion — the wrong Doctor or VisitType chosen at check-in, a mistyped Purpose of Visit, a Vital Sign entered against the wrong field, a typo in a signed consultation note — and soft delete is the wrong tool for a correction. This ADR replaces ADR 0027's immutability rule for **Completed** Visits only.

A Completed Visit may be amended by a user holding the dedicated `visit:amend` permission. Amendment covers:

- the Visit's own record: Doctor, VisitType, Admit Source, Treatment and Session, Purpose of Visit (chief complaint) and Remarks;
- the Clinical Notes linked to that Visit, **including signed notes** — an amended signed note keeps its `signed` status and original `signedAt`;
- the Vital Sign readings linked to that Visit — the reading keeps its `recordedAt` unless one is supplied, and BMI is recomputed.

Amendment never changes the Visit's lifecycle or identity: Visit Status, Visit date, Visit Number (ADR 0028), Queue Token (ADR 0029), transition timestamps and the Appointment link stay as recorded. A clinical record cannot be relinked to another Visit or an Admission through amendment.

Each amendment is its own operation (`PUT /api/v1/visits/{id}/amend`, `.../notes/{noteId}/amend`, `.../vitals/{vitalId}/amend`) behind `visit:amend`, rather than relaxing the ordinary update endpoints. The ordinary endpoints keep their existing rules for Active Visits, so `visit:update` and `clinical-note:update` holders cannot rewrite history by accident, and the authority to change a closed record is granted deliberately per role. `visit:amend` is granted to the system Tenant Admin role by default.

**Cancelled Visits remain immutable.** Cancellation is a clinical outcome; correcting what was recorded on a Visit that did not happen has no use case yet.

**Consequences.** Amendments overwrite in place and update `modifiedOn`; there is no amendment history or "amended by" record yet. For signed Clinical Notes this is a weaker guarantee than an append-only addendum model. If regulatory audit requires it, the migration path is an amendment log table (who, when, before/after) written in the same transaction as each amend command, and an "Amended" marker on the note.
