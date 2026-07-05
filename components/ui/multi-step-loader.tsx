'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

import { cn } from '@/lib/utils';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      fill="none"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function CheckFilled({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      />
    </svg>
  );
}

export type LoadingState = {
  text: string;
};

function LoaderCore({
  value = 0,
  loadingStates,
}: {
  value?: number;
  loadingStates: LoadingState[];
}) {
  return (
    <div className="relative mx-auto mt-40 flex max-w-xl flex-col justify-start">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);

        return (
          <motion.div
            key={index}
            className="mb-4 flex gap-2 text-left"
            initial={{ opacity: 0, y: -(value * 40) }}
            animate={{ opacity, y: -(value * 40) }}
            transition={{ duration: 0.5 }}
          >
            <div>
              {index > value && <CheckIcon className="text-foreground" />}
              {index <= value && (
                <CheckFilled className={cn('text-foreground', value === index && 'text-primary')} />
              )}
            </div>
            <span className={cn('text-foreground', value === index && 'text-primary')}>
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function MultiStepLoader({
  loop = true,
  loading,
  duration = 2000,
  loadingStates,
}: {
  loop?: boolean;
  loading?: boolean;
  duration?: number;
  loadingStates: LoadingState[];
}) {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentState((previousState) =>
        loop
          ? previousState === loadingStates.length - 1
            ? 0
            : previousState + 1
          : Math.min(previousState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background fixed inset-0 z-50 flex h-full w-full items-center justify-center"
          >
            <div className="relative h-96">
              <LoaderCore value={currentState} loadingStates={loadingStates} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
