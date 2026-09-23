CREATE TABLE "patient_treatment_plan" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_treatment_plan_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"treatment_id" integer,
	"treatment_name" text NOT NULL,
	"treatment_code" text NOT NULL,
	"treatment_source_identity" text,
	"session_structure" varchar(20) NOT NULL,
	"total_sessions" integer NOT NULL,
	"status_override" varchar(20),
	"legacy_source_identity" text,
	"legacy_source_system" varchar(100),
	"legacy_visit_id" text,
	"legacy_visit_number" text,
	"import_batch_id" text,
	CONSTRAINT "patient_treatment_plan_total_sessions_check" CHECK ("patient_treatment_plan"."total_sessions" > 0),
	CONSTRAINT "patient_treatment_plan_structure_check" CHECK ("patient_treatment_plan"."session_structure" in ('REPEATABLE', 'SEQUENCED')),
	CONSTRAINT "patient_treatment_plan_status_override_check" CHECK ("patient_treatment_plan"."status_override" is null or "patient_treatment_plan"."status_override" = 'STOPPED')
);
--> statement-breakpoint
CREATE TABLE "patient_treatment_plan_session" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_treatment_plan_session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	"tenant_id" varchar(255) NOT NULL,
	"patient_treatment_plan_id" integer NOT NULL,
	"treatment_session_id" integer,
	"session_number" integer NOT NULL,
	"label" text,
	"procedure" text,
	"duration_minutes" integer,
	"setup_minutes" integer,
	"cleaning_minutes" integer,
	"preparation" text,
	"warning" text,
	"equipment" text,
	"room_type" text,
	"therapist_skill" text,
	"legacy_conduction_note" text,
	"completion_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"completion_source" varchar(20),
	"completed_visit_id" integer,
	"completed_at" timestamp with time zone,
	CONSTRAINT "patient_treatment_plan_session_number_check" CHECK ("patient_treatment_plan_session"."session_number" > 0),
	CONSTRAINT "patient_treatment_plan_session_completion_check" CHECK ((
    "patient_treatment_plan_session"."completion_status" = 'PENDING' and "patient_treatment_plan_session"."completion_source" is null
    and "patient_treatment_plan_session"."completed_visit_id" is null and "patient_treatment_plan_session"."completed_at" is null
  ) or (
    "patient_treatment_plan_session"."completion_status" = 'COMPLETED' and "patient_treatment_plan_session"."completion_source" is not null and (
      ("patient_treatment_plan_session"."completion_source" = 'VISIT' and "patient_treatment_plan_session"."completed_visit_id" is not null and "patient_treatment_plan_session"."completed_at" is not null)
      or ("patient_treatment_plan_session"."completion_source" = 'LEGACY_IMPORT' and "patient_treatment_plan_session"."completed_visit_id" is null)
    )
  ))
);
--> statement-breakpoint
CREATE TABLE "patient_treatment_plan_session_reservation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_treatment_plan_session_reservation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	"tenant_id" varchar(255) NOT NULL,
	"patient_treatment_plan_session_id" integer NOT NULL,
	"appointment_id" integer NOT NULL
);
--> statement-breakpoint
DROP INDEX "treatment_tenant_name_idx";--> statement-breakpoint
DROP INDEX "treatment_tenant_code_idx";--> statement-breakpoint
ALTER TABLE "treatment" ALTER COLUMN "duration_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment" ALTER COLUMN "setup_minutes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "treatment" ALTER COLUMN "setup_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment" ALTER COLUMN "cleaning_minutes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "treatment" ALTER COLUMN "cleaning_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment_session" ALTER COLUMN "duration_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment_session" ALTER COLUMN "setup_minutes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "treatment_session" ALTER COLUMN "setup_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment_session" ALTER COLUMN "cleaning_minutes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "treatment_session" ALTER COLUMN "cleaning_minutes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "patient_treatment_plan_id" integer;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "patient_treatment_plan_session_id" integer;--> statement-breakpoint
ALTER TABLE "treatment" ADD COLUMN "session_structure" varchar(20) DEFAULT 'SEQUENCED' NOT NULL;--> statement-breakpoint
ALTER TABLE "treatment" ADD COLUMN "default_total_sessions" integer;--> statement-breakpoint
ALTER TABLE "treatment" ADD COLUMN "legacy_source_identity" text;--> statement-breakpoint
ALTER TABLE "treatment" ADD COLUMN "legacy_source_system" varchar(100);--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD CONSTRAINT "patient_treatment_plan_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD CONSTRAINT "patient_treatment_plan_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD CONSTRAINT "patient_treatment_plan_session_patient_treatment_plan_id_patient_treatment_plan_id_fk" FOREIGN KEY ("patient_treatment_plan_id") REFERENCES "public"."patient_treatment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD CONSTRAINT "patient_treatment_plan_session_treatment_session_id_treatment_session_id_fk" FOREIGN KEY ("treatment_session_id") REFERENCES "public"."treatment_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD CONSTRAINT "patient_treatment_plan_session_completed_visit_id_visit_id_fk" FOREIGN KEY ("completed_visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session_reservation" ADD CONSTRAINT "patient_treatment_plan_session_reservation_patient_treatment_plan_session_id_patient_treatment_plan_session_id_fk" FOREIGN KEY ("patient_treatment_plan_session_id") REFERENCES "public"."patient_treatment_plan_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session_reservation" ADD CONSTRAINT "patient_treatment_plan_session_reservation_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_treatment_plan_tenant_patient_idx" ON "patient_treatment_plan" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "patient_treatment_plan_tenant_treatment_idx" ON "patient_treatment_plan" USING btree ("tenant_id","treatment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_treatment_plan_tenant_legacy_source_idx" ON "patient_treatment_plan" USING btree ("tenant_id","legacy_source_identity") WHERE "patient_treatment_plan"."legacy_source_identity" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_treatment_plan_session_tenant_plan_number_idx" ON "patient_treatment_plan_session" USING btree ("tenant_id","patient_treatment_plan_id","session_number") WHERE "patient_treatment_plan_session"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "patient_treatment_plan_session_tenant_visit_idx" ON "patient_treatment_plan_session" USING btree ("tenant_id","completed_visit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ptp_session_reservation_active_session_idx" ON "patient_treatment_plan_session_reservation" USING btree ("tenant_id","patient_treatment_plan_session_id") WHERE "patient_treatment_plan_session_reservation"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "ptp_session_reservation_active_appointment_idx" ON "patient_treatment_plan_session_reservation" USING btree ("tenant_id","appointment_id") WHERE "patient_treatment_plan_session_reservation"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_treatment_plan_id_patient_treatment_plan_id_fk" FOREIGN KEY ("patient_treatment_plan_id") REFERENCES "public"."patient_treatment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_treatment_plan_session_id_patient_treatment_plan_session_id_fk" FOREIGN KEY ("patient_treatment_plan_session_id") REFERENCES "public"."patient_treatment_plan_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_tenant_legacy_source_idx" ON "treatment" USING btree ("tenant_id",lower("legacy_source_identity")) WHERE "treatment"."is_deleted" = false and "treatment"."legacy_source_identity" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_tenant_name_idx" ON "treatment" USING btree ("tenant_id",lower("name")) WHERE "treatment"."is_deleted" = false and "treatment"."legacy_source_identity" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_tenant_code_idx" ON "treatment" USING btree ("tenant_id",lower("code")) WHERE "treatment"."is_deleted" = false and "treatment"."legacy_source_identity" is null;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_treatment_plan_pair_check" CHECK (("appointment"."patient_treatment_plan_id" is null) = ("appointment"."patient_treatment_plan_session_id" is null));--> statement-breakpoint
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_session_structure_check" CHECK ("treatment"."session_structure" in ('REPEATABLE', 'SEQUENCED'));--> statement-breakpoint
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_default_total_sessions_check" CHECK ("treatment"."default_total_sessions" is null or ("treatment"."session_structure" = 'REPEATABLE' and "treatment"."default_total_sessions" > 0));
--> statement-breakpoint
-- Backfill Patient Treatment Plan permissions for already-onboarded Tenants. New
-- onboardings receive these through the Permission Catalogue seed path.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('appointments', 'patient-treatment-plan', 'read', 'patient-treatment-plan:read', 'View Patient Treatment Plans and Sessions.'),
  ('appointments', 'patient-treatment-plan', 'assign', 'patient-treatment-plan:assign', 'Assign Treatments to Patients and create Patient Treatment Plans.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."resource" = 'patient-treatment-plan'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
