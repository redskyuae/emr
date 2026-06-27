CREATE TABLE "work_order_code_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_order" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "work_order_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"code" varchar(20) NOT NULL,
	"asset_id" integer NOT NULL,
	"type_id" integer NOT NULL,
	"priority_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"technician" varchar(150),
	"due_date" date,
	"completed_on" timestamp with time zone,
	"note" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_type_id_work_order_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."work_order_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_priority_id_work_order_priority_id_fk" FOREIGN KEY ("priority_id") REFERENCES "public"."work_order_priority"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_status_id_work_order_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."work_order_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "work_order_tenant_code_idx" ON "work_order" USING btree ("tenant_id",lower("code"));