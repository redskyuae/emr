# Appointments Start in the System Scheduled Status

Creating an Appointment always assigns the Tenant's System Appointment Status in the Scheduled category; clients do not submit `appointmentStatusId`. This prevents callers from bypassing the lifecycle by creating an Appointment already Completed, Cancelled, or in another later state.

AppointmentStatus therefore carries a stable system category, separate from its Tenant-customizable name, code, and description. System Appointment Statuses cannot be removed or reassigned to another category. Requiring a client-selected status was rejected because it exposes lifecycle initialization as presentation data, while looking up the mutable `SCH` code was rejected because tenants can currently edit or delete it.
