CREATE UNIQUE INDEX "country_name_idx" ON "country" USING btree (lower("name")) WHERE "country"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "country_code_idx" ON "country" USING btree (lower("code")) WHERE "country"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "language_name_idx" ON "language" USING btree (lower("name")) WHERE "language"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "language_code_idx" ON "language" USING btree (lower("code")) WHERE "language"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "nationality_name_idx" ON "nationality" USING btree (lower("name")) WHERE "nationality"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "nationality_code_idx" ON "nationality" USING btree (lower("code")) WHERE "nationality"."is_deleted" = false;