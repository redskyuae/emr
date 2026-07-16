# Appointments Always Reference Patients

Every Appointment must reference a Patient, including appointments booked by phone for a person who has not completed Patient Registration. In that workflow, the system creates a Provisional Patient with minimum identity and contact details; it does not make the Appointment's Patient optional or embed temporary caller details in the Appointment.

This keeps scheduling history attached to a stable Patient identity and supports repeat bookings, duplicate detection, and later reconciliation. The rejected alternative—allowing an Appointment without a Patient—would create a second store of patient-like data and require later relinking throughout the Appointment lifecycle.

A Provisional Patient receives the normal permanent, tenant-scoped Medical Record Number when the record is created. Completing or reconciling the record does not replace that identifier; sequence gaps caused by callers who never arrive remain acceptable under ADR 0019.

Appointment booking is the orchestration boundary for the phone-booking workflow. The create-Appointment operation requires exactly one of `patientId` for an existing active Patient or `provisionalPatient` containing the minimum details for a new Provisional Patient; supplying both or neither is invalid. When provisional details are supplied, it creates both records atomically and stores the resulting Patient identifier on the Appointment. A separate Provisional Patient endpoint was rejected because reception should complete phone booking through one operation, without coordinating a partially completed two-request workflow.

Patient Registration Status is server-controlled. Normal Patient creation produces a Registered Patient, Appointment orchestration may produce a Provisional Patient, and a full valid update through the existing Patient update operation automatically completes registration. Clients cannot assign the registration state directly, and existing Patient records migrate as Registered Patients.

Provisional Patients may hold multiple Appointments but are ineligible for check-in or Visit creation. Reception must complete their registration or reconcile them with an existing Registered Patient before clinical care begins.

Before creating a Provisional Patient, Appointment booking searches active Patients by normalized first name, last name, and phone. A possible match produces a conflict with minimal Patient summaries and requires an explicit retry using the selected `patientId`; the system never links or merges records automatically from demographic similarity. Only a no-match request may create a Provisional Patient and its Appointment.
