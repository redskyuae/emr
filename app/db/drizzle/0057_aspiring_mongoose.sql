ALTER TABLE "appointment" ALTER COLUMN "doctor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "appointment_mode_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "appointment_type_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "appointment_reason_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "rota_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "booking_path" varchar(20) DEFAULT 'CONSULTATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "start_time" varchar(5);--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "end_time" varchar(5);--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_booking_path_check" CHECK ("appointment"."booking_path" in ('CONSULTATION', 'PROCEDURE'));--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_booking_path_fields_check" CHECK ((
        "appointment"."booking_path" = 'CONSULTATION'
        and "appointment"."doctor_id" is not null
        and "appointment"."appointment_mode_id" is not null
        and "appointment"."appointment_type_id" is not null
        and "appointment"."appointment_reason_id" is not null
        and "appointment"."rota_name" is not null
      ) or (
        "appointment"."booking_path" = 'PROCEDURE'
        and "appointment"."start_time" is not null
        and "appointment"."end_time" is not null
        and "appointment"."end_time" > "appointment"."start_time"
        and "appointment"."appointment_mode_id" is null
        and "appointment"."appointment_type_id" is null
        and "appointment"."appointment_reason_id" is null
        and "appointment"."rota_name" is null
      ));