// Only an OPD Consultation needs a Doctor at Check-in; other Visit Types (Follow-up,
// Procedure, Vaccination, Emergency, …) may be created without one. The rule keys
// on the Visit Type code because the name is Tenant-editable display text.
const DOCTOR_REQUIRED_VISIT_TYPE_CODE = 'OPD';

export function visitTypeRequiresDoctor(visitTypeCode: string | null | undefined) {
  return visitTypeCode?.trim().toUpperCase() === DOCTOR_REQUIRED_VISIT_TYPE_CODE;
}
