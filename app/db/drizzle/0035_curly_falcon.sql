CREATE TABLE "allergen" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "allergen_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(20) NOT NULL,
	"category" varchar(20) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clinical_note_type" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clinical_note_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "diagnosis_code" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "diagnosis_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "allergen_tenant_name_idx" ON "allergen" USING btree ("tenant_id",lower("name")) WHERE "allergen"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "allergen_tenant_code_idx" ON "allergen" USING btree ("tenant_id",lower("code")) WHERE "allergen"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "clinical_note_type_tenant_name_idx" ON "clinical_note_type" USING btree ("tenant_id",lower("name")) WHERE "clinical_note_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "clinical_note_type_tenant_code_idx" ON "clinical_note_type" USING btree ("tenant_id",lower("code")) WHERE "clinical_note_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "diagnosis_code_tenant_code_idx" ON "diagnosis_code" USING btree ("tenant_id",lower("code")) WHERE "diagnosis_code"."is_deleted" = false;