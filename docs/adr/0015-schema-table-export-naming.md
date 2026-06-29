# Schema Table Variable Naming: Export Without Suffix, Import With Alias

Schema files in `app/db/schema/` export their `pgTable` variable without a `Table` suffix (e.g. `export const appointmentCancelledReason = pgTable(...)`). Every consumer — other schema files and repository files — imports the export with an `as xxxTable` alias (e.g. `import { appointmentCancelledReason as appointmentCancelledReasonTable } from ...`).

The schema file represents a domain entity; the `Table` suffix is a Drizzle-specific implementation detail that belongs at the call site, not in the definition. Keeping the export name clean means the schema file reads as domain vocabulary. Consumers use the alias to be explicit that they are working with a Drizzle table object.

**Scope:** All domain and junction tables under `app/db/schema/`. Auth tables (`auth.ts`) are BetterAuth-owned and are excluded.
