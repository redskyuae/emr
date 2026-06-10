CREATE UNIQUE INDEX "organization_name_idx" ON "organization" USING btree (lower("name"));
