CREATE TABLE "treatment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "treatment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"setup_minutes" integer DEFAULT 0 NOT NULL,
	"cleaning_minutes" integer DEFAULT 0 NOT NULL,
	"room_type" varchar(100),
	"therapist_skill" varchar(100),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "treatment_session" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "treatment_session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"treatment_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"label" varchar(200) NOT NULL,
	"procedure" varchar(200) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"setup_minutes" integer DEFAULT 0 NOT NULL,
	"cleaning_minutes" integer DEFAULT 0 NOT NULL,
	"preparation" text,
	"warning" text,
	"equipment" text,
	"room_type" varchar(100),
	"therapist_skill" varchar(100),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "treatment_id" integer;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "treatment_session_id" integer;--> statement-breakpoint
ALTER TABLE "visit" ADD COLUMN "treatment_id" integer;--> statement-breakpoint
ALTER TABLE "visit" ADD COLUMN "treatment_session_id" integer;--> statement-breakpoint
ALTER TABLE "treatment_session" ADD CONSTRAINT "treatment_session_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_tenant_name_idx" ON "treatment" USING btree ("tenant_id",lower("name")) WHERE "treatment"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_tenant_code_idx" ON "treatment" USING btree ("tenant_id",lower("code")) WHERE "treatment"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "treatment_tenant_idx" ON "treatment" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_session_tenant_treatment_number_idx" ON "treatment_session" USING btree ("tenant_id","treatment_id","session_number") WHERE "treatment_session"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "treatment_session_treatment_idx" ON "treatment_session" USING btree ("treatment_id");--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_treatment_session_id_treatment_session_id_fk" FOREIGN KEY ("treatment_session_id") REFERENCES "public"."treatment_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_treatment_id_treatment_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_treatment_session_id_treatment_session_id_fk" FOREIGN KEY ("treatment_session_id") REFERENCES "public"."treatment_session"("id") ON DELETE no action ON UPDATE no action;