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

The top-level user for a Tenant. The creator of a Tenant always becomes the Tenant Owner. A Tenant Owner has Tenant Admin authority for that Tenant, is not necessarily Staff, and is not itself a Role.

## Tenant Admin

An administrative authority belonging to a specific Tenant, including the Tenant Owner and delegated administrators for that Tenant. Manages Facilities, configures Masters, and provisions Staff accounts within their Tenant; Tenant Admin authority does not apply across Tenants.

## Session

An authenticated access period for a user on one browser or device. Signing out ends the current Session only. Revoking all Sessions is a separate administrative/security action.

## Current User

The authenticated user as seen within their Active Tenant for the current Session — their identity, their Tenant membership, their assigned Roles, and their Effective Permissions taken together. The Current User is whoever the Session belongs to and is the subject of the `/api/v1/me` endpoint. A Current User may be a Tenant Owner (who has no Staff profile and no Role Assignments) or a Staff member.

## Role

A Tenant-scoped authorization label that can carry permissions and be assigned to users. Distinct from Staff job profiles, Doctor clinical identity, and authentication-layer membership roles.

## Role Assignment

The association between a Staff member and a Role within a Tenant. A Staff member must have at least one Role Assignment.

## Permission

A system-wide authorization capability representing one allowed action on one protected resource. Permissions are assigned to Roles and are shared by all Tenants.

## Permission Catalogue

The system-wide set of Permissions available for assignment to Roles. Every Tenant sees the same Permission Catalogue.

## Permission Module

A user-facing product area used to group Permissions in the Permission Catalogue, such as Identity & Access or Appointment Masters.

## System Role

A Role provided by the system rather than created by Tenant Admins. Distinct from Tenant Owner authority; System Roles may be edited but are not removed by Tenant Admins.

## Permission Action

The specific operation allowed by a Permission on a protected resource. Permission Actions should be precise enough to distinguish reading, creating, updating, deleting, assigning, revoking, deactivating, and reactivating access.

## Permission Key

A stable identifier for a Permission in `<resource>:<action>` form. The Permission Module groups the Permission separately and is not part of the Permission Key.

## Permission Assignment

The association between a Role and a Permission within a Tenant. A Role's Permission Assignments define what users with that Role are allowed to do.

## Effective Permissions

The complete set of Permissions a user actually holds within a Tenant, expressed as Permission Keys. For a Tenant Owner or Tenant Admin, the Effective Permissions are the entire active Permission Catalogue. For any other user, they are the de-duplicated union of the Permission Assignments of every Role assigned to that user. Effective Permissions are derived from membership and Role Assignments, never stored.

## Staff

A user who works within one or more Facilities under exactly one Tenant. Includes doctors, nurses, receptionists, and technicians. Not the same as a Doctor (see below).

**Staff and User are the same entity, named differently by layer.** Frontend/product copy calls it Staff; the backend, auth layer, and API surface call it User (e.g. the `/api/v1/users` routes and `/identity-access/users` screen both operate on Staff). Treat the terms as synonyms — there is no separate "User" concept distinct from Staff in this domain.

## Doctor

A Staff member with a clinical specialty who sees Patients. A Doctor is always a Staff member, but not all Staff are Doctors. Creating a Doctor always provisions the underlying Staff member; a Doctor cannot exist without a Staff identity.

## Specialty

A Tenant-scoped Master representing a Doctor's clinical area of expertise or credential (e.g., Cardiology, Pediatrics, Orthopedics). A Specialty is a property of the Doctor and is independent of Facility. Distinct from Department, which is an organizational unit within a Facility — a Department named "Cardiology" may be staffed by Doctors of differing Specialties, and a Doctor keeps their Specialty regardless of where they work. Each Tenant manages its own Specialties independently.

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

A Tenant-scoped Master that classifies Assets, such as Diagnostic Imaging, Patient Monitoring, Life Support, Surgical, Laboratory, Mobility & Furniture, and IT & Network. Each Asset Category carries a display color used to distinguish it in the UI. Each Tenant manages its own Asset Categories independently.

## Asset Status

A Tenant-scoped Master that defines the operational lifecycle state of an Asset, such as in use, available, under maintenance, under repair, or retired. Distinct from Asset Condition, which describes physical wear rather than operational state.

## System Asset Status

An Asset Status provided to every Tenant whose stable code identifies its system meaning. A Tenant may customize its display details, but cannot change its code.

## Out-of-Service Asset

An Asset in the Maintenance or Repair System Asset Status. Tenant-created Asset Statuses are not considered out of service unless the domain later introduces an explicit classification for them.

## Retired Asset

An Asset in the Retired System Asset Status. It is no longer operational but remains part of the Tenant's Asset portfolio.

## Asset Portfolio Value

The total net book value of the Tenant's Assets. An Asset without a recorded current value contributes zero.

## Tenant Reporting Currency

The single currency in which a Tenant records and aggregates Asset monetary values. Assets within a Tenant do not carry independent currencies.

## Asset Condition

A Tenant-scoped Master that grades the physical condition of an Asset, such as Excellent, Good, Fair, or Poor. Distinct from Asset Status, which describes whether the Asset is operationally in use, available, or out of service.

## Custodian

The Staff member accountable for an Asset. An Asset may also be unassigned when no Custodian is currently responsible for it.

## Work Order

A maintenance job against an Asset, such as preventive maintenance, corrective repair, calibration, or inspection.

## Work Order Technician

The person or external service provider responsible for performing a Work Order. A Work Order Technician may be internal Staff or a vendor and is not necessarily a Staff member.

## Active Work Order

A Work Order whose Work Order Status Category is not Completed. Distinct from a Work Order in the Open category, which is one particular kind of Active Work Order.

## Work Order Type

A Tenant-scoped Master that classifies the nature of the maintenance work in a Work Order, such as Preventive, Corrective, Calibration, or Inspection. Distinct from Work Order Priority, which ranks urgency, and Work Order Status, which tracks lifecycle state. Each Tenant manages its own Work Order Types independently.

## Work Order Priority

A Tenant-scoped Master that ranks the urgency of a Work Order, such as Low, Medium, High, or Critical, and carries a display color for priority badges. Distinct from Work Order Type, which describes the nature of the work, and from Work Order Status, which tracks lifecycle state.

## Work Order Status

A Tenant-scoped Master that defines the lifecycle state of a Work Order. Every Work Order Status belongs to a Work Order Status Category; it is distinct from Asset Status, which describes the operational state of the Asset itself rather than the maintenance job.

## Work Order Status Category

The system-defined lifecycle meaning assigned to a Work Order Status: Open, In Progress, Scheduled, Completed, or Overdue. Tenant-created statuses use a category so lifecycle rules and reporting remain stable when display details or codes differ; Overdue is explicitly assigned rather than inferred from a Work Order's due date.

## System Work Order Status

A Work Order Status provided to every Tenant for one Work Order Status Category. Its stable code identifies the system status; a Tenant may customize its display details, but cannot change its code or remove it.
