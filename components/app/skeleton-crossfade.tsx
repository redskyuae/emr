'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// power3.out (easeOutCubic), the ease DESIGN.md sets for all motion.
const EASE_OUT = [0.33, 1, 0.68, 1] as const;

type SkeletonCrossfadeProps = {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
};

// Swaps a loading skeleton for its content with a short crossfade: the skeleton is lifted out of
// the layout ("popLayout") and fades away on top while the content fades in underneath, so the
// page never holds both heights. Content that is already cached renders at once with no fade
// (initial={false}), going back to loading swaps instantly, and prefers-reduced-motion turns the
// fade off entirely. `children` is still evaluated while loading, so it must not dereference data
// that has not arrived yet.
export function SkeletonCrossfade({
  isLoading,
  skeleton,
  children,
  className,
}: SkeletonCrossfadeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-busy={isLoading} className={cn('relative', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {isLoading ? (
          <motion.div
            key="skeleton"
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE_OUT }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
