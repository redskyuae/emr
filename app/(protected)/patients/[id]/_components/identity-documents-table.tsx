'use client';

import type { PatientIdentityDocument } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getPatientIdentityDocumentTypeLabel,
  isIdentityDocumentExpired,
} from '../../_utils/patient-value-sets';

// A repeating collection cannot be a DetailField pair, so it gets its own small
// table. Expiry is flagged rather than merely displayed: an expired passport at
// check-in is something the desk must catch at a glance, and flagging it is the
// whole reason the expiry date is stored.
export function IdentityDocumentsTable({ documents }: { documents: PatientIdentityDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-muted-foreground text-sm">No identity documents recorded.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Issuing country</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => {
            const expired = isIdentityDocumentExpired(document.expiryDate);

            return (
              <TableRow key={document.id}>
                <TableCell>
                  {getPatientIdentityDocumentTypeLabel(document.documentType)}
                  {document.label ? (
                    <span className="text-muted-foreground"> — {document.label}</span>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-sm">{document.documentNumber}</TableCell>
                <TableCell>{document.issuingCountry?.name ?? '—'}</TableCell>
                <TableCell>
                  {document.expiryDate ? (
                    <span className="flex items-center gap-2">
                      {document.expiryDate}
                      {expired ? <Badge variant="destructive">Expired</Badge> : null}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
