ALTER TABLE "visit" ADD COLUMN IF NOT EXISTS "legacy_visit_number" text;--> statement-breakpoint
-- Visits imported from the Dhathri source system recorded their source number only in
-- remarks ("Source visit 1453. Treatments: ..."). Lift it into its own column so imported
-- Patient Treatment Plans, which carry the same legacy_visit_number, can be matched to it.
UPDATE "visit"
SET "legacy_visit_number" = substring("remarks" from '^Source visit ([0-9]+)')
WHERE "legacy_visit_number" IS NULL AND "remarks" ~ '^Source visit [0-9]+';
