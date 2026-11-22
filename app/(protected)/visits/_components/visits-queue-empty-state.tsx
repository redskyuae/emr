import Link from 'next/link';
import { PiClipboardTextDuotone, PiMagnifyingGlassDuotone, PiPlusLight } from 'react-icons/pi';

import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';

// The Visit queue with nothing to list for the chosen day. The date is the day being viewed, not a
// filter, so only a Doctor, status or search turns this into "No results found".
export function VisitsQueueEmptyState({
  visitDate,
  isFiltered,
  canCreate,
}: {
  visitDate: string;
  /** A Doctor or status filter, or a search, is narrowing the queue. */
  isFiltered: boolean;
  /** The user may create a Visit, so the "nothing yet" state offers Create Visit. */
  canCreate: boolean;
}) {
  if (isFiltered) {
    return (
      <EmptyState
        tone="neutral"
        title="No results found"
        icon={PiMagnifyingGlassDuotone}
        className="bg-card min-h-80 border"
        description={`No Visits on ${visitDate} match the current filters.`}
      />
    );
  }

  return (
    <EmptyState
      tone="blue"
      icon={PiClipboardTextDuotone}
      title={`No Visits for ${visitDate}`}
      className="bg-card min-h-80 border"
      description="Create a Visit from a booked Appointment or for a Walk-in Patient."
      actions={
        canCreate ? (
          <Button asChild>
            <Link href="/visits/new">
              <PiPlusLight className="size-4" />
              Create Visit
            </Link>
          </Button>
        ) : null
      }
    />
  );
}
