CREATE TABLE "visit_unassigned_queue_token_counter" (
	"tenant_id" varchar(255) NOT NULL,
	"token_date" date NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "visit_unassigned_queue_token_counter_tenant_id_token_date_pk" PRIMARY KEY("tenant_id","token_date")
);
--> statement-breakpoint
ALTER TABLE "visit" ALTER COLUMN "doctor_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "visit_unassigned_day_token_idx" ON "visit" USING btree ("tenant_id","visit_date","queue_token") WHERE "visit"."is_deleted" = false and "visit"."doctor_id" is null;