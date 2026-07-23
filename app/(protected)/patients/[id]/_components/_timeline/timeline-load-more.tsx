'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function TimelineLoadMore({
  hasNextPage,
  isFetchingNextPage,
  loadedCount,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadedCount: number;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  return (
    <>
      {/* Announces appended pages for screen readers, which get no signal from a
          scroll-triggered fetch. */}
      <p aria-live="polite" className="sr-only">
        {loadedCount} timeline events loaded
      </p>

      {hasNextPage ? (
        // The observer normally fires first, but the button keeps the next page
        // keyboard-reachable and gives a manual path if the observer never fires
        // (hidden tab, zero-height container).
        <div ref={sentinelRef} className="flex justify-center py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-xs">
          Beginning of this Patient&rsquo;s history
        </p>
      )}
    </>
  );
}
