# Domain Glossary

## Tenant
A hospital group or hospital chain (e.g., Apollo Hospitals, Fortis Healthcare). The top-level unit of isolation in the system. All data belongs to a tenant. A tenant owns one or more Facilities.

## Facility
A single physical location operated by a Tenant — a hospital, clinic, diagnostic center, or day-care unit. Has a `facilityType` attribute (HOSPITAL, CLINIC, LAB, etc.). Staff and clinical events are always scoped to a Facility within a Tenant.

## Platform Admin
An operator-level user who manages the SaaS platform itself. Can onboard Tenants and manage system-wide configuration. Not affiliated with any Tenant.

## Tenant Admin
An administrative user belonging to a specific Tenant. Manages Facilities, configures Masters, and provisions Staff accounts within their Tenant.

## Staff
A user who works within one or more Facilities under a Tenant. Includes doctors, nurses, receptionists, and technicians. Has a role that determines access. Not the same as a Doctor (see below).

## Doctor
A Staff member with a clinical specialty who sees Patients. A Doctor is always a Staff member, but not all Staff are Doctors.

## Patient
A person who receives care at a Facility. Belongs to a Tenant (registered within that tenant's system). Not a Staff member.

## Appointment
A scheduled time slot for a Patient to see a Doctor at a Facility. An Appointment is a scheduling concept — it leads to a Visit when the Patient arrives. An Appointment is not the clinical event itself.

## Visit
An outpatient clinical event. Occurs when a Patient attends a Facility for a consultation or procedure without being admitted overnight. A Visit is typically preceded by an Appointment but may be walk-in.

## Admission
An inpatient clinical event. Occurs when a Patient is admitted to a Facility and occupies a Bed, typically overnight or for an extended stay. Distinct from a Visit — do not conflate them.

## Master
Reference/configuration data that other modules depend on. Examples: Department, Doctor, Ward, Bed. Masters are configured per Tenant before clinical modules can operate.

## Department
A clinical or administrative unit within a Facility (e.g., Cardiology, Emergency, Radiology).

## Ward
A named section of a Facility containing Beds, used for inpatient care (e.g., ICU, General Ward, Maternity).

## Bed
A physical bed within a Ward. Has a status (available, occupied, reserved). A Patient is assigned a Bed upon Admission.
