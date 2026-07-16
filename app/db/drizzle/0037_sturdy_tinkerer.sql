CREATE TABLE "clinical_note" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clinical_note_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_id" integer,
	"note_type_id" integer NOT NULL,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"signed_at" timestamp with time zone,
	"author_user_id" varchar(255) NOT NULL,
	"recorded_by_user_id" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_allergy" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_allergy_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"allergen_id" integer,
	"substance" varchar(150),
	"reaction" varchar(255),
	"severity" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"noted_on" date,
	"notes" text,
	"recorded_by_user_id" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_medication" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_medication_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"drug_name" varchar(200) NOT NULL,
	"dose" varchar(100),
	"route" varchar(50),
	"frequency" varchar(100),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" date,
	"end_date" date,
	"notes" text,
	"recorded_by_user_id" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_problem" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_problem_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"diagnosis_code_id" integer,
	"title" varchar(255) NOT NULL,
	"clinical_status" varchar(20) DEFAULT 'active' NOT NULL,
	"onset_date" date,
	"resolved_date" date,
	"notes" text,
	"recorded_by_user_id" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "patient_vital_sign" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "patient_vital_sign_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_id" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"height_cm" double precision,
	"weight_kg" double precision,
	"bmi" double precision,
	"systolic" integer,
	"diastolic" integer,
	"pulse_bpm" integer,
	"resp_rate" integer,
	"temperature_c" double precision,
	"spo2" integer,
	"pain_score" integer,
	"notes" text,
	"recorded_by_user_id" varchar(255) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_note_type_id_clinical_note_type_id_fk" FOREIGN KEY ("note_type_id") REFERENCES "public"."clinical_note_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergy" ADD CONSTRAINT "patient_allergy_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergy" ADD CONSTRAINT "patient_allergy_allergen_id_allergen_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "public"."allergen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_medication" ADD CONSTRAINT "patient_medication_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_problem" ADD CONSTRAINT "patient_problem_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_problem" ADD CONSTRAINT "patient_problem_diagnosis_code_id_diagnosis_code_id_fk" FOREIGN KEY ("diagnosis_code_id") REFERENCES "public"."diagnosis_code"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vital_sign" ADD CONSTRAINT "patient_vital_sign_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;