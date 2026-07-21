import { index, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { masterColumns } from './helpers';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

// Documents uploaded against a Visit (referrals, scans, prior reports). The file
// itself lives in Vercel Blob; only its URL and metadata are persisted here.
export const visitDocument = pgTable(
  'visit_document',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    visitId: integer('visit_id')
      .notNull()
      .references(() => visitTable.id),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileUrl: text('file_url').notNull(),
    contentType: varchar('content_type', { length: 150 }).notNull(),
    fileSize: integer('file_size').notNull(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantVisitIdx: index('visit_document_tenant_visit_idx').on(table.tenantId, table.visitId),
  })
);
