CREATE TABLE "room_type" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"color" varchar(7) NOT NULL,
	"daily_rate" numeric(12, 2),
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"room_number" varchar(20) NOT NULL,
	"room_type_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'AVAILABLE' NOT NULL,
	"bed_count" integer DEFAULT 1 NOT NULL,
	"floor" varchar(20),
	"wing" varchar(50),
	"facility" varchar(150),
	"department" varchar(150),
	"notes" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "room_status_check" CHECK ("room"."status" in ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING')),
	CONSTRAINT "room_bed_count_check" CHECK ("room"."bed_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_room_type_id_room_type_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_type_tenant_name_idx" ON "room_type" USING btree ("tenant_id",lower("name")) WHERE "room_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "room_type_tenant_code_idx" ON "room_type" USING btree ("tenant_id",lower("code")) WHERE "room_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "room_tenant_room_number_idx" ON "room" USING btree ("tenant_id",lower("room_number")) WHERE "room"."is_deleted" = false;