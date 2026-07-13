CREATE TABLE "doctor_rota" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_rota_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"to_time" varchar(5) NOT NULL,
	"from_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_rota_tenant_name_idx" ON "doctor_rota" USING btree ("tenant_id",lower("name")) WHERE "doctor_rota"."is_deleted" = false;