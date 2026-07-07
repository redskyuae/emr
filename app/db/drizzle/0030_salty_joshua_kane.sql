CREATE TABLE "patient" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"mrn" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"gender" varchar(20) NOT NULL,
	"date_of_birth" date NOT NULL,
	"blood_group" varchar(5),
	"marital_status" varchar(20),
	"phone" varchar(20) NOT NULL,
	"alternate_phone" varchar(20),
	"email" varchar(255),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state_id" integer,
	"country_id" integer,
	"postal_code" varchar(20),
	"nationality_id" integer,
	"language_id" integer,
	"religion_id" integer,
	"govt_id_type" varchar(30),
	"govt_id_number" varchar(50),
	"emergency_contact_name" varchar(150),
	"emergency_contact_relationship" varchar(50),
	"emergency_contact_phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_mrn_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_state_id_state_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_country_id_country_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."country"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_nationality_id_nationality_id_fk" FOREIGN KEY ("nationality_id") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_language_id_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_religion_id_religion_id_fk" FOREIGN KEY ("religion_id") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_tenant_mrn_idx" ON "patient" USING btree ("tenant_id",lower("mrn"));--> statement-breakpoint
CREATE UNIQUE INDEX "patient_tenant_govt_id_idx" ON "patient" USING btree ("tenant_id","govt_id_type",lower("govt_id_number")) WHERE "patient"."is_deleted" = false and "patient"."govt_id_number" is not null;