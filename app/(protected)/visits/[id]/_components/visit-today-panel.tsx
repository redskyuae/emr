'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarPlus, NotebookPen } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { VisitDetailsCard } from './visit-details-card';

export function VisitTodayPanel({
  visit,
  canCreateNote,
  canBookAppointment,
  onDailyTreatment,
}: {
  visit: Visit;
  canCreateNote: boolean;
  canBookAppointment: boolean;
  onDailyTreatment: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = visit.status === 'CHECKED_IN' || visit.status === 'IN_CONSULTATION';
  const session = visit.treatmentSession;
  const description = session?.procedure ?? '';
  const canExpand = description.length > 190;

  return (
    <div className="space-y-4">
      {session ? (
        <Card className="shadow-fluent-2 gap-4">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Session {session.sessionNumber} ·{' '}
                {session.durationMinutes ? `${session.durationMinutes} min` : 'Duration not set'}
              </span>
              <Badge variant={active ? 'secondary' : 'outline'}>
                {visit.status === 'COMPLETED' ? 'Completed' : active ? 'In progress' : 'Cancelled'}
              </Badge>
            </div>
            <CardTitle className="text-lg">Daily treatment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {visit.treatment ? <Badge variant="outline">{visit.treatment.name}</Badge> : null}
              <Badge variant="outline">{session.label}</Badge>
            </div>
            <div>
              <p
                className={cn(
                  'text-muted-foreground text-sm',
                  !expanded && canExpand && 'line-clamp-2'
                )}
              >
                {description || 'No procedure details recorded for this Session.'}
              </p>
              {canExpand ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((current) => !current)}
                >
                  {expanded ? 'Show less' : 'Read more'}
                </Button>
              ) : null}
            </div>
            {active && canCreateNote ? (
              <div className="border-t pt-4">
                <Button type="button" onClick={onDailyTreatment}>
                  <NotebookPen className="size-4" />
                  Record treatment response
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <VisitDetailsCard visit={visit} />

      {canBookAppointment ? (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href="/appointments/new">
              <CalendarPlus className="size-4" />
              {session ? 'Book next Session' : 'Book follow-up Appointment'}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
