import { AlertTriangle, Clock3, MapPin, Stethoscope, UserRound } from 'lucide-react';

import type { StaticClinicianVisit, VisitStatus } from '../../../_data/static-clinician-visits';
import { visitStatusPresentation } from '../../../_utils/visit-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VisitSafetyStrip({
  visit,
  status,
  allergies,
}: {
  visit: StaticClinicianVisit;
  status?: VisitStatus;
  allergies?: string[];
}) {
  const currentStatus = status ?? visit.status;
  const presentation = visitStatusPresentation(currentStatus);
  const currentAllergies = allergies ?? visit.allergies;
  const allergyAlert = !currentAllergies.some((allergy) => allergy === 'No known allergies');

  return (
    <Card className="acrylic shadow-fluent-8 sticky top-40 z-10 gap-0 py-0 sm:top-32 lg:top-16">
      <CardContent className="grid gap-3 p-3 md:grid-cols-2 md:p-4 xl:grid-cols-[1.35fr_1fr_1fr] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base leading-none font-semibold">{visit.patient.name}</h2>
              <Badge variant={presentation.variant}>{presentation.label}</Badge>
              <span className="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded text-xs font-semibold">
                {visit.queueToken}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {visit.patient.mrn} · {visit.patient.age}y · {visit.patient.sex} ·{' '}
              {visit.patient.nationality}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="text-muted-foreground size-3.5" aria-hidden="true" />
            <span className="font-medium">{visit.facility}</span>
            <span className="text-muted-foreground">· {visit.tenant}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Stethoscope className="text-muted-foreground size-3.5" aria-hidden="true" />
            <span>{visit.doctor.name}</span>
            <span className="text-muted-foreground">· {visit.doctor.specialty}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <Clock3 className="size-3.5" aria-hidden="true" />
            <span className="font-mono">{visit.visitNumber}</span>
            <span>· {visit.visitType.name}</span>
            <span>· {formatTime(visit.startedAt)}</span>
          </div>
        </div>

        <div
          className={
            allergyAlert
              ? 'border-destructive/40 bg-destructive/5 text-destructive flex min-h-14 items-center gap-2 rounded-md border px-3 py-2 md:col-span-2 xl:col-span-1'
              : 'border-border bg-muted/40 text-foreground flex min-h-14 items-center gap-2 rounded-md border px-3 py-2 md:col-span-2 xl:col-span-1'
          }
          role="status"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold">Allergies</p>
            <p className="text-sm leading-snug">{currentAllergies.join(' · ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
