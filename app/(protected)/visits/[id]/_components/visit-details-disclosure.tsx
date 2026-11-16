'use client';

import { ChevronRight, ClipboardList } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { VisitDetailsCard } from './visit-details-card';

function plain(value: string | null | undefined) {
  return (
    value
      ?.replace(/[*_#>`]/g, '')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

/** The Visit's handover Remarks, folded away so the complaint stays first. */
export function VisitDetailsDisclosure({ visit }: { visit: Visit }) {
  const summary = plain(visit.remarks) || 'No remarks recorded';

  return (
    <Collapsible className="group/details rounded-lg border">
      <CollapsibleTrigger className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-3">
        <ChevronRight
          className="size-4 shrink-0 transition-transform group-data-[state=open]/details:rotate-90"
          aria-hidden="true"
        />
        <ClipboardList className="text-primary size-4 shrink-0" aria-hidden="true" />
        <span className="shrink-0 text-sm font-semibold">Visit details</span>
        <span className="text-muted-foreground min-w-0 truncate text-sm">{summary}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        <VisitDetailsCard visit={visit} embedded />
      </CollapsibleContent>
    </Collapsible>
  );
}
