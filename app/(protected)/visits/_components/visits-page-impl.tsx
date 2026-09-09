import { CalendarDays, CircleDotDashed, FlaskConical } from 'lucide-react';

import { toVisitBoardRows } from '../_data/static-clinician-visits';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VisitsTable } from './visits-table';

export function VisitsPageImpl() {
  const visits = toVisitBoardRows();

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2 overflow-hidden">
        <CardContent className="flex items-center justify-between gap-6 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
              <FlaskConical className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">Clinician workflow demonstration</h2>
                <Badge variant="outline">Static data</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose a Visit to review the complete outpatient assessment in one workspace.
              </p>
            </div>
          </div>

          <div className="text-muted-foreground hidden shrink-0 items-center gap-4 text-xs lg:flex">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              09 Sep 2026
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDotDashed className="size-4" aria-hidden="true" />2 Visits
            </span>
          </div>
        </CardContent>
      </Card>

      <VisitsTable visits={visits} />
    </div>
  );
}
