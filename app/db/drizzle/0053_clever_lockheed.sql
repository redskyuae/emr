CREATE TABLE "patient_identity_document" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_identity_document_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"document_type" varchar(30) NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"issuing_country_id" integer,
	"expiry_date" date,
	"label" varchar(100),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "patient_identity_document_type_check" CHECK ("patient_identity_document"."document_type" in ('passport', 'national-id', 'residence-visa', 'driving-license', 'other'))
);
--> statement-breakpoint
DROP INDEX "patient_tenant_govt_id_idx";--> statement-breakpoint
ALTER TABLE "patient_identity_document" ADD CONSTRAINT "patient_identity_document_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_identity_document" ADD CONSTRAINT "patient_identity_document_issuing_country_id_country_id_fk" FOREIGN KEY ("issuing_country_id") REFERENCES "public"."country"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_identity_document_tenant_patient_idx" ON "patient_identity_document" USING btree ("tenant_id","patient_id");--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "govt_id_type";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "govt_id_number";