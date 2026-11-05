ALTER TABLE "charge_item" ADD COLUMN "cash_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "charge_item" ADD COLUMN "insurance_contract_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "charge_item" ADD COLUMN "free_follow_up_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "charge_item" ADD COLUMN "effective_date" date;--> statement-breakpoint
ALTER TABLE "charge_item" ADD COLUMN "visit_charge_kind" varchar(32);--> statement-breakpoint
ALTER TABLE "charge_item" ADD CONSTRAINT "charge_item_cash_price_check" CHECK ("charge_item"."cash_price" >= 0);--> statement-breakpoint
ALTER TABLE "charge_item" ADD CONSTRAINT "charge_item_insurance_contract_price_check" CHECK ("charge_item"."insurance_contract_price" >= 0);--> statement-breakpoint
ALTER TABLE "charge_item" ADD CONSTRAINT "charge_item_visit_charge_kind_check" CHECK ("charge_item"."visit_charge_kind" in ('NEW_CONSULTATION', 'ESTABLISHED_CONSULTATION', 'FOLLOW_UP_CONSULTATION', 'TREATMENT_SESSION'));