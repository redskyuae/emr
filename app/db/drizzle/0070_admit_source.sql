CREATE TABLE "admit_source" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admit_source_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
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
ALTER TABLE "visit" ADD COLUMN "admit_source_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "admit_source_tenant_name_idx" ON "admit_source" USING btree ("tenant_id",lower("name")) WHERE "admit_source"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "admit_source_tenant_code_idx" ON "admit_source" USING btree ("tenant_id",lower("code")) WHERE "admit_source"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_admit_source_id_admit_source_id_fk" FOREIGN KEY ("admit_source_id") REFERENCES "public"."admit_source"("id") ON DELETE no action ON UPDATE no action;