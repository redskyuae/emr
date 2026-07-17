import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { admission as admissionTable } from './admission';
import { bed as bedTable } from './bed';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const admissionBedTransfer = pgTable(
  'admission_bed_transfer',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    admissionId: integer('admission_id')
      .notNull()
      .references(() => admissionTable.id),
    fromBedId: integer('from_bed_id')
      .notNull()
      .references(() => bedTable.id),
    toBedId: integer('to_bed_id')
      .notNull()
      .references(() => bedTable.id),
    reason: varchar({ length: 255 }),
    transferredAt: timestamp('transferred_at', { withTimezone: true }).notNull().defaultNow(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantAdmissionIdx: index('admission_bed_transfer_tenant_admission_idx').on(
      table.tenantId,
      table.admissionId
    ),
  })
);
