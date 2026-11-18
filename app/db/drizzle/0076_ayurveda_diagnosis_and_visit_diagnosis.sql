-- Databases that ran the unmerged feat-diagnosis-code branch already hold an older
-- "ayurveda_diagnosis_code" table (title, is_active) with seeded codes. Move it aside so this
-- migration can create the current shape; its rows are copied over at the end. On every
-- other database this block does nothing.
DO $$
BEGIN
  IF to_regclass('public.ayurveda_diagnosis_code') IS NOT NULL THEN
    ALTER TABLE "clinical_note" DROP CONSTRAINT IF EXISTS "clinical_note_ayurveda_diagnosis_code_fk";
    ALTER TABLE "ayurveda_diagnosis_code" RENAME TO "ayurveda_diagnosis_code_legacy";
    ALTER TABLE "ayurveda_diagnosis_code_legacy" RENAME CONSTRAINT "ayurveda_diagnosis_code_pkey" TO "ayurveda_diagnosis_code_legacy_pkey";
    ALTER INDEX IF EXISTS "ayurveda_diagnosis_code_tenant_code_idx" RENAME TO "ayurveda_diagnosis_code_legacy_tenant_code_idx";
    ALTER SEQUENCE IF EXISTS "ayurveda_diagnosis_code_id_seq" RENAME TO "ayurveda_diagnosis_code_legacy_id_seq";
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "ayurveda_diagnosis_code" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ayurveda_diagnosis_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"english_name" varchar(255),
	"category" varchar(100),
	"icd_diagnosis_code_id" integer,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visit_diagnosis" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visit_diagnosis_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"visit_id" integer NOT NULL,
	"code_system" varchar(10) NOT NULL,
	"diagnosis_code_id" integer,
	"ayurveda_diagnosis_code_id" integer,
	"diagnosis_type" varchar(10) NOT NULL,
	"sort_order" integer NOT NULL,
	"notes" varchar(500),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "visit_diagnosis_code_system_check" CHECK ("visit_diagnosis"."code_system" in ('ICD10CM', 'AYURVEDA')),
	CONSTRAINT "visit_diagnosis_diagnosis_type_check" CHECK ("visit_diagnosis"."diagnosis_type" in ('PRINCIPAL', 'SECONDARY')),
	CONSTRAINT "visit_diagnosis_code_reference_check" CHECK (("visit_diagnosis"."code_system" = 'ICD10CM' and "visit_diagnosis"."diagnosis_code_id" is not null and "visit_diagnosis"."ayurveda_diagnosis_code_id" is null) or ("visit_diagnosis"."code_system" = 'AYURVEDA' and "visit_diagnosis"."ayurveda_diagnosis_code_id" is not null and "visit_diagnosis"."diagnosis_code_id" is null))
);
--> statement-breakpoint
ALTER TABLE "charge_item" ADD COLUMN "code_type" varchar(10) DEFAULT 'LOCAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "ayurveda_diagnosis_code" ADD CONSTRAINT "ayurveda_diagnosis_code_icd_diagnosis_code_id_diagnosis_code_id_fk" FOREIGN KEY ("icd_diagnosis_code_id") REFERENCES "public"."diagnosis_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_diagnosis" ADD CONSTRAINT "visit_diagnosis_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_diagnosis" ADD CONSTRAINT "visit_diagnosis_diagnosis_code_id_diagnosis_code_id_fk" FOREIGN KEY ("diagnosis_code_id") REFERENCES "public"."diagnosis_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_diagnosis" ADD CONSTRAINT "visit_diagnosis_ayurveda_diagnosis_code_id_ayurveda_diagnosis_code_id_fk" FOREIGN KEY ("ayurveda_diagnosis_code_id") REFERENCES "public"."ayurveda_diagnosis_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ayurveda_diagnosis_code_tenant_code_idx" ON "ayurveda_diagnosis_code" USING btree ("tenant_id",lower("code")) WHERE "ayurveda_diagnosis_code"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "visit_diagnosis_tenant_visit_idx" ON "visit_diagnosis" USING btree ("tenant_id","visit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visit_diagnosis_tenant_visit_principal_idx" ON "visit_diagnosis" USING btree ("tenant_id","visit_id","code_system") WHERE "visit_diagnosis"."diagnosis_type" = 'PRINCIPAL' and "visit_diagnosis"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "charge_item" ADD CONSTRAINT "charge_item_code_type_check" CHECK ("charge_item"."code_type" in ('CPT', 'HCPCS', 'SERVICE', 'LOCAL'));
--> statement-breakpoint
-- Carry the older table's codes into the current shape: title becomes name, and an inactive
-- code is kept as a removed one so it no longer appears in pickers.
DO $$
BEGIN
  IF to_regclass('public.ayurveda_diagnosis_code_legacy') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO "ayurveda_diagnosis_code"
        ("tenant_id", "code", "name", "category", "is_deleted", "created_on", "modified_on", "deleted_on")
      SELECT
        "tenant_id",
        upper("code"),
        "title",
        "category",
        "is_deleted" OR NOT "is_active",
        "created_on",
        "modified_on",
        CASE WHEN "is_deleted" OR NOT "is_active" THEN coalesce("deleted_on", now()) END
      FROM "ayurveda_diagnosis_code_legacy"
      ORDER BY "id"';
    EXECUTE 'DROP TABLE "ayurveda_diagnosis_code_legacy"';
  END IF;
END $$;
