CREATE TABLE "ayurveda_diagnosis_code" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ayurveda_diagnosis_code_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"code" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical_note" ADD COLUMN "diagnosis_code_id" integer;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD COLUMN "ayurveda_diagnosis_code_id" integer;--> statement-breakpoint
ALTER TABLE "diagnosis_code" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ayurveda_diagnosis_code_tenant_code_idx" ON "ayurveda_diagnosis_code" USING btree ("tenant_id",lower("code")) WHERE "ayurveda_diagnosis_code"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_diagnosis_code_id_diagnosis_code_id_fk" FOREIGN KEY ("diagnosis_code_id") REFERENCES "public"."diagnosis_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_ayurveda_diagnosis_code_fk" FOREIGN KEY ("ayurveda_diagnosis_code_id") REFERENCES "public"."ayurveda_diagnosis_code"("id") ON DELETE no action ON UPDATE no action;