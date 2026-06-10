CREATE TABLE "appointment_cancelled_reason" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appointment_cancelled_reason_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "appointment_reason" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appointment_reason_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_cancelled_reason_tenant_name_idx" ON "appointment_cancelled_reason" USING btree ("tenant_id",lower("name")) WHERE "appointment_cancelled_reason"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_cancelled_reason_tenant_code_idx" ON "appointment_cancelled_reason" USING btree ("tenant_id",lower("code")) WHERE "appointment_cancelled_reason"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_reason_tenant_name_idx" ON "appointment_reason" USING btree ("tenant_id",lower("name")) WHERE "appointment_reason"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_reason_tenant_code_idx" ON "appointment_reason" USING btree ("tenant_id",lower("code")) WHERE "appointment_reason"."is_deleted" = false;