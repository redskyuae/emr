# Tenant Time Zone Defines Local Operational Time

Each Tenant has an IANA time zone used to interpret local operational dates and times such as DoctorSlots and Appointments. Existing Tenants are backfilled to `Asia/Kolkata`, which is also the default for newly provisioned Tenants until they explicitly configure another zone.

Appointment clients submit local `DD-MM-YYYY` dates and `HH:mm` times rather than UTC instants; the server combines them in the Tenant Time Zone when deciding whether a slot has passed. Using the deployment server's time zone was rejected because infrastructure location must not change clinical scheduling behavior, while accepting offsets in every booking request was rejected because the Tenant—not the caller—owns the operational clock.
