import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';

import { db } from '../app/db';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from '../app/db/schema/treatment';

const TENANT_ID = 'N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S';
const KEEP_CODES = ['TRT-0400', 'TRT-0401'];

const toDelete = await db
  .select({ id: treatmentTable.id, code: treatmentTable.code })
  .from(treatmentTable)
  .where(
    and(
      eq(treatmentTable.tenantId, TENANT_ID),
      eq(treatmentTable.isDeleted, false),
      notInArray(treatmentTable.code, KEEP_CODES)
    )
  );

const ids = toDelete.map((row) => row.id);

if (ids.length > 0) {
  await db
    .delete(treatmentSessionTable)
    .where(
      and(
        eq(treatmentSessionTable.tenantId, TENANT_ID),
        inArray(treatmentSessionTable.treatmentId, ids)
      )
    );
  await db
    .delete(treatmentTable)
    .where(and(eq(treatmentTable.tenantId, TENANT_ID), inArray(treatmentTable.id, ids)));
}

const [{ total }] = await db
  .select({ total: sql<number>`count(*)::int` })
  .from(treatmentTable)
  .where(and(eq(treatmentTable.tenantId, TENANT_ID), eq(treatmentTable.isDeleted, false)));

console.log(JSON.stringify({ deleted: ids.length, remaining: total }));
process.exit(0);
