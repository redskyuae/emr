# Visit Diagnoses Are Coded Records for UAE Claims

Until now the consultation's Assessment step stored its "modern diagnosis" as text inside the consultation Clinical Note (`Modern diagnosis: M54.5 — Low back pain`), and the Ayurvedic diagnosis as free text. Nothing linked a Visit to a Diagnosis Code row, so the diagnosis could not be reported, filtered, or put on an insurance claim.

The product runs in the UAE, where payers (DHA eClaimLink, DoH Shafafiya) require ICD-10-CM diagnoses, one Principal and any number of Secondary, and CPT/HCPCS or regulator service codes for activities. There is no mandated Ayurveda code set.

**Decision.**

- Diagnoses on a Visit are **Visit Diagnosis** rows (`visit_diagnosis`) that reference a master by id, with a code system (`ICD10CM` or `AYURVEDA`), a type (`PRINCIPAL` or `SECONDARY`), an order, and optional notes. When a code system has any diagnoses, exactly one of them is Principal. A partial unique index enforces this in the database as well as in the validator.
- Ayurveda diagnoses come from a new Tenant-scoped **Ayurveda Diagnosis Code** master. Each code may map to an ICD-10-CM Diagnosis Code, which is what a claim reports for it.
- The list is saved as a whole (replace-all, in one transaction) through `PUT /api/v1/visits/{id}/diagnoses` while the Visit is active (`visit:update`), and through `PUT /api/v1/visits/{id}/diagnoses/amend` once it is Completed (`visit:amend`, ADR 0047). A master row the Visit already references stays valid even after it is deactivated or deleted, so history still reads and old Visits stay amendable.
- The Diagnosis Code master validates the ICD-10-CM format on create and update.
- Charge Items carry a **code type** (`CPT`, `HCPCS`, `SERVICE`, `LOCAL`). CPT and HCPCS codes are validated against their formats; existing Charge Items default to `LOCAL`.
- The Assessment step is named **Diagnosis** in the UI. Its step id and the SOAP `assessment` column are unchanged, so saved notes and links keep working.

**Consequences.** Older consultation notes keep their text diagnosis, and the note parser still reads it. New Visits record coded diagnoses separately from the narrative. Putting Visit Diagnoses and CPT codes onto Invoices or claims is not done yet; when it is, it reads these records rather than parsing note text.
