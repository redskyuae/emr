CREATE TABLE "work_order_type" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_order_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"color" varchar(7) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "work_order_type_tenant_name_idx" ON "work_order_type" USING btree ("tenant_id",lower("name")) WHERE "work_order_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "work_order_type_tenant_code_idx" ON "work_order_type" USING btree ("tenant_id",lower("code")) WHERE "work_order_type"."is_deleted" = false;