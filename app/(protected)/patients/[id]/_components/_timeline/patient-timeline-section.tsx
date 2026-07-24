'use client';

import { useCallback } from 'react';
import { useQueryState } from 'nuqs';
import { CalendarClock } from 'lucide-react';

import {
  TIMELINE_FEEDS,
  type TimelineFeed,
} from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientTimelineQuery } from '@/app/queries/patients/timeline/usePatientTimeline';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import { TimelineDayGroupSection } from './timeline-day-group';
import { TimelineFilterChips } from './timeline-filter-chips';
import { TimelineLoadMore } from './timeline-load-more';

function parseFeed(value: string | null): TimelineFeed {
  return TIMELINE_FEEDS.includes(value as TimelineFeed) ? (value as TimelineFeed) : 'all';
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Patient Timeline">
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {[0, 1].map((entry) => (
            <div key={entry} className="bg-card shadow-fluent-2 rounded-xl border p-3">
              <div className="flex items-start gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PatientTimelineSection({ patientId }: { patientId: number }) {
  const [feedParam, setFeedParam] = useQueryState('feed');
  const feed = parseFeed(feedParam);
  const timelineQuery = usePatientTimelineQuery(patientId, feed);

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = timelineQuery;
  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleFeedChange = (nextFeed: TimelineFeed) => {
    // `all` is the default, so it is cleared from the URL rather than pinned.
    void setFeedParam(nextFeed === 'all' ? null : nextFeed);
  };

  const groups = timelineQuery.data ?? [];
  const loadedCount = groups.reduce((total, group) => total + group.events.length, 0);

  return (
    <div className="space-y-4">
      <TimelineFilterChips feed={feed} onFeedChange={handleFeedChange} />

      {timelineQuery.isLoading ? <TimelineSkeleton /> : null}

      {timelineQuery.isError ? (
        <Empty className="min-h-56">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Could not load the Timeline</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(timelineQuery.error)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!timelineQuery.isLoading && !timelineQuery.isError && loadedCount === 0 ? (
        <Empty className="min-h-56">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Nothing to show yet</EmptyTitle>
            <EmptyDescription>
              {feed === 'all'
                ? 'This Patient has no recorded activity.'
                : 'No activity matches this filter.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {loadedCount > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <TimelineDayGroupSection key={group.dayKey} group={group} patientId={patientId} />
          ))}

          <TimelineLoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            loadedCount={loadedCount}
            onLoadMore={onLoadMore}
          />
        </div>
      ) : null}
    </div>
  );
}
