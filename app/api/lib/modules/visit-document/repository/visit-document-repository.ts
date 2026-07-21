import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { visitDocument as visitDocumentTable } from '@/app/db/schema/visit-document';
import type {
  ValidatedAddVisitDocumentData,
  VisitDocument,
  VisitDocumentMetadata,
} from '../schemas/visit-document-schema';

type Executor = Pick<typeof db, 'select' | 'insert' | 'update'>;

const documentColumns = {
  id: visitDocumentTable.id,
  visitId: visitDocumentTable.visitId,
  fileUrl: visitDocumentTable.fileUrl,
  fileName: visitDocumentTable.fileName,
  fileSize: visitDocumentTable.fileSize,
  createdOn: visitDocumentTable.createdOn,
  contentType: visitDocumentTable.contentType,
};

async function listByVisit(tenantId: string, visitId: number): Promise<VisitDocument[]> {
  return db
    .select(documentColumns)
    .from(visitDocumentTable)
    .where(
      and(
        eq(visitDocumentTable.tenantId, tenantId),
        eq(visitDocumentTable.visitId, visitId),
        eq(visitDocumentTable.isDeleted, false)
      )
    )
    .orderBy(asc(visitDocumentTable.createdOn), asc(visitDocumentTable.id));
}

async function findById(id: number, tenantId: string): Promise<VisitDocument | undefined> {
  const [row] = await db
    .select(documentColumns)
    .from(visitDocumentTable)
    .where(
      and(
        eq(visitDocumentTable.id, id),
        eq(visitDocumentTable.tenantId, tenantId),
        eq(visitDocumentTable.isDeleted, false)
      )
    )
    .limit(1);

  return row;
}

async function addDocument(data: ValidatedAddVisitDocumentData): Promise<VisitDocument> {
  const [created] = await db
    .insert(visitDocumentTable)
    .values({
      tenantId: data.tenantId,
      visitId: data.visitId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      contentType: data.contentType,
      fileSize: data.fileSize,
    })
    .returning(documentColumns);

  return created;
}

// Used inside the Check-in transaction so a Visit and the documents attached at
// check-in are created atomically. Accepts the transaction executor.
async function insertMany(
  executor: Executor,
  tenantId: string,
  visitId: number,
  documents: VisitDocumentMetadata[]
): Promise<void> {
  if (documents.length === 0) {
    return;
  }

  await executor.insert(visitDocumentTable).values(
    documents.map((document) => ({
      tenantId,
      visitId,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      contentType: document.contentType,
      fileSize: document.fileSize,
    }))
  );
}

async function deleteDocument(id: number, tenantId: string): Promise<VisitDocument | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(visitDocumentTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(visitDocumentTable.id, id),
        eq(visitDocumentTable.tenantId, tenantId),
        eq(visitDocumentTable.isDeleted, false)
      )
    )
    .returning(documentColumns);

  return deleted;
}

export const visitDocumentRepository = {
  findById,
  insertMany,
  listByVisit,
  addDocument,
  deleteDocument,
};
