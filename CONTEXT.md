# Domain Glossary

## Tenant

A hospital group or hospital chain (e.g., Apollo Hospitals, Fortis Healthcare). The top-level unit of isolation in the system. All data belongs to a tenant. A tenant owns one or more Facilities. Workspace may appear as user-facing copy, but Tenant is the canonical domain term.

## Tenant Slug

A stable, URL-safe identifier for a Tenant. Generated when the Tenant is created and not changed when the Tenant's display name changes.

## Active Tenant

A Tenant currently allowed to operate in the system.

## Inactive Tenant

A Tenant that has been deactivated without being removed from the system.

## Tenant Provisioning

The domain process that turns a new Tenant into an operational Tenant by establishing ownership and baseline configuration. Distinct from signup, which is only one user-facing entry point into provisioning.

## Facility

A single physical location operated by a Tenant — a hospital, clinic, diagnostic center, or day-care unit. Has a `facilityType` attribute (HOSPITAL, CLINIC, LAB, etc.). Staff and clinical events are always scoped to a Facility within a Tenant.

## Tenant Owner

The top-level user for a Tenant. The creator of a Tenant always becomes the Tenant Owner. A Tenant Owner has Tenant Admin authority for that Tenant and is not necessarily Staff.

## Tenant Admin

An administrative authority belonging to a specific Tenant, including the Tenant Owner and delegated administrators for that Tenant. Manages Facilities, configures Masters, and provisions Staff accounts within their Tenant; Tenant Admin authority does not apply across Tenants.

## Role

A Tenant-scoped authorization label that can carry permissions and be assigned to users. Distinct from Staff job profiles, Doctor clinical identity, and authentication-layer membership roles.

## Role Assignment

The association between a Staff member and a Role within a Tenant. A Staff member must have at least one Role Assignment.

## Permission

A system-wide authorization capability representing one allowed action on one protected resource. Permissions are assigned to Roles and are shared by all Tenants.

## Permission Catalogue

The system-wide set of Permissions available for assignment to Roles. Every Tenant sees the same Permission Catalogue.

## Permission Assignment

The association between a Role and a Permission within a Tenant. A Role's Permission Assignments define what users with that Role are allowed to do.

## System Role

A Role provided for every Tenant as a baseline authorization label. System Roles may be renamed but are not removed by Tenant Admins.

## Staff

A user who works within one or more Facilities under exactly one Tenant. Includes doctors, nurses, receptionists, and technicians. Not the same as a Doctor (see below).

## Doctor

A Staff member with a clinical specialty who sees Patients. A Doctor is always a Staff member, but not all Staff are Doctors.

## Patient

A person who receives care at a Facility. Belongs to a Tenant (registered within that tenant's system). Not a Staff member.

## Appointment

A scheduled time slot for a Patient to see a Doctor at a Facility. An Appointment is a scheduling concept — it leads to a Visit when the Patient arrives. An Appointment is not the clinical event itself.

## AppointmentMode

A Tenant-scoped Master that defines the channel or format of an Appointment, such as in-person, video, phone, or home visit. Each Tenant manages its own AppointmentModes independently.

## AppointmentType

A Tenant-scoped Master that defines the clinical category or visit type of an Appointment, such as new consultation, follow-up, emergency, or procedure. Distinct from AppointmentMode, which describes the channel or format of the Appointment.

## AppointmentStatus

A Tenant-scoped Master that defines the lifecycle state of an Appointment, such as scheduled, confirmed, checked-in, completed, cancelled, or no-show. Distinct from AppointmentMode, which describes the channel or format of the Appointment, and AppointmentType, which describes the clinical category or visit type.

## AppointmentReason

A Tenant-scoped Master that defines why an Appointment is being booked, either as stated by the Patient or assigned clinically. Distinct from AppointmentType, which describes the clinical category or visit type of the Appointment.

## AppointmentCancelledReason

A Tenant-scoped Master that defines why an Appointment was cancelled. Distinct from AppointmentStatus: the AppointmentStatus records the cancellation state, while AppointmentCancelledReason records the reason behind that transition.

## Visit

An outpatient clinical event. Occurs when a Patient attends a Facility for a consultation or procedure without being admitted overnight. A Visit is typically preceded by an Appointment but may be walk-in.

## Admission

An inpatient clinical event. Occurs when a Patient is admitted to a Facility and occupies a Bed, typically overnight or for an extended stay. Distinct from a Visit — do not conflate them.

## Master

Reference/configuration data that other modules depend on. Examples: Department, Doctor, Ward, Bed. Masters are configured per Tenant before clinical modules can operate.

## Global Reference

Reference data shared by all Tenants. Unlike a Master, a Global Reference is not configured per Tenant.

## Language

A Global Reference representing a spoken or written language used during Patient registration and communication preferences.

## Nationality

A Global Reference representing a Patient's citizenship or nationality, used during Patient registration and demographics. Distinct from Language, which represents what a Patient speaks or writes.

## Religion

A Global Reference representing a Patient's religious preference, used during Patient registration and care planning. Distinct from Tenant-scoped Masters because Religion values are shared across Tenants.

## Country

A Global Reference representing a country used in Patient addresses and other geographic reference fields. A Country may contain one or more States.

## State

A Global Reference representing a state, province, or union territory within a Country, used in Patient addresses. A State always belongs to exactly one Country.

## Department

A clinical or administrative unit within a Facility (e.g., Cardiology, Emergency, Radiology).

## Ward

A named section of a Facility containing Beds, used for inpatient care (e.g., ICU, General Ward, Maternity).

## Bed

A physical bed within a Ward. Has a status (available, occupied, reserved). A Patient is assigned a Bed upon Admission.

## Asset

A trackable piece of physical equipment owned by the Tenant, located at a Facility, serving a Department, and overseen by a Custodian.

## Asset Category

A classification for Assets, such as Diagnostic Imaging, Patient Monitoring, Life Support, Surgical, Laboratory, Mobility & Furniture, and IT & Network.

## Custodian

The Staff member accountable for an Asset. An Asset may also be unassigned when no Custodian is currently responsible for it.

## Work Order

A maintenance job against an Asset, such as preventive maintenance, corrective repair, calibration, or inspection.
