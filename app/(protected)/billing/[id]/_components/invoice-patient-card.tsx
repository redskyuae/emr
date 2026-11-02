import Link from 'next/link';

import type { Invoice } from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InvoicePatientCard({ invoice }: { invoice: Invoice }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="text-base">Patient &amp; encounter</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">Patient</p>
          <p className="font-semibold">
            {invoice.patient.firstName} {invoice.patient.lastName}
          </p>
          <p className="text-muted-foreground font-mono">{invoice.patient.mrn}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Encounter</p>
          {invoice.visit ? (
            <Link
              href={`/visits/${invoice.visit.id}`}
              className="text-primary font-medium hover:underline"
            >
              Visit {invoice.visit.visitNumber}
            </Link>
          ) : invoice.admission ? (
            <Link
              href={`/admissions/${invoice.admission.id}`}
              className="text-primary font-medium hover:underline"
            >
              Admission {invoice.admission.admissionNumber}
            </Link>
          ) : (
            <p>Counter sale</p>
          )}
        </div>
        {invoice.notes ? (
          <div className="sm:col-span-2">
            <p className="text-muted-foreground text-xs">Notes</p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
