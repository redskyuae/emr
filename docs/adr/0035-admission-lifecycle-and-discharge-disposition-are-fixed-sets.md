# Admission Lifecycle and Discharge Disposition Are Fixed Sets

Admission Status is a fixed system-defined set of three values — `ADMITTED`, `DISCHARGED`, `CANCELLED` — stored as a checked column, following the Visit Status reasoning in ADR 0027: the lifecycle drives hard rules (legal transitions, bed release, clinical-capture eligibility) and gains nothing from Tenant-editable indirection.

Allowed transitions are enforced in validators, and each transition is its own command:

- `ADMITTED → DISCHARGED` — discharge; requires a Discharge Disposition, optionally a Discharge Summary.
- `ADMITTED → CANCELLED` — the admission was a mistake or the Patient left before care; requires a reason.
- Bed Transfer is only legal while `ADMITTED`.

No other transition is legal. A Discharged or Cancelled Admission is immutable except for soft delete (ADR 0012), which remains an administrative correction distinct from cancellation.

Discharge Disposition is likewise a fixed system-defined set — `ROUTINE`, `LAMA`, `TRANSFERRED`, `DECEASED`, `ABSCONDED` — matching the FHIR discharge-disposition concept and the dispositions Indian HMS products treat as reporting-critical (LAMA and death rates are regulatory numbers; letting Tenants rename or fork them would corrupt that reporting). Should a Tenant ever need custom dispositions, the AppointmentStatus category pattern is the migration path.
