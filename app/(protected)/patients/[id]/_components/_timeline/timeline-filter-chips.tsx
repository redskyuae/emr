'use client';

import type { TimelineFeed } from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import { Button } from '@/components/ui/button';

const FEED_OPTIONS: { value: TimelineFeed; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'encounters', label: 'Encounters' },
  { value: 'billing', label: 'Billing' },
  { value: 'records', label: 'Records' },
];

export function TimelineFilterChips({
  feed,
  onFeedChange,
}: {
  feed: TimelineFeed;
  onFeedChange: (feed: TimelineFeed) => void;
}) {
  return (
    <div role="group" aria-label="Filter timeline" className="flex flex-wrap items-center gap-2">
      {FEED_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={feed === option.value ? 'default' : 'outline'}
          aria-pressed={feed === option.value}
          onClick={() => onFeedChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
