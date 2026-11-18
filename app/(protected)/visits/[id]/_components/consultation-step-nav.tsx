'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { IconType } from 'react-icons';
import { CiMedicalClipboard, CiStethoscope } from 'react-icons/ci';
import { PiChatTextLight, PiCheckLight, PiLeafLight, PiSealCheckLight } from 'react-icons/pi';

import { cn } from '@/lib/utils';

import type { ConsultationStep, ConsultationStepId } from '../_utils/consultation-steps';

gsap.registerPlugin(useGSAP);

type StepTone = {
  icon: IconType;
  /** Icon and accent text. */
  text: string;
  /** Tinted surface behind the step heading icon. */
  soft: string;
  /** Fill of the step heading's progress bar. */
  progress: string;
};

/**
 * Each step keeps one colour so the Doctor can tell where they are at a glance.
 * Plan & Session uses the Treatment colour and Review uses the completion colour.
 */
export const STEP_TONE: Record<ConsultationStepId, StepTone> = {
  subjective: {
    icon: PiChatTextLight,
    text: 'text-primary',
    soft: 'bg-primary/10',
    progress: '*:data-[slot=progress-indicator]:bg-primary',
  },
  objective: {
    icon: CiStethoscope,
    text: 'text-chart-4',
    soft: 'bg-chart-4/12',
    progress: '*:data-[slot=progress-indicator]:bg-chart-4',
  },
  assessment: {
    icon: CiMedicalClipboard,
    text: 'text-pop',
    soft: 'bg-pop/10',
    progress: '*:data-[slot=progress-indicator]:bg-pop',
  },
  plan: {
    icon: PiLeafLight,
    text: 'text-procedure',
    soft: 'bg-procedure/10',
    progress: '*:data-[slot=progress-indicator]:bg-procedure',
  },
  review: {
    icon: PiSealCheckLight,
    text: 'text-success',
    soft: 'bg-success/10',
    progress: '*:data-[slot=progress-indicator]:bg-success',
  },
};

const CURRENT_STEP = '[aria-current="step"]';

/**
 * The steps as a pill track on the page, the same look as `components/ui/tabs.tsx`: a white
 * capsule with a hairline ring and one ink pill that glides to the current step. It stays a
 * `nav` of buttons rather than tabs because every step is one part of the same consultation.
 * Until the pill has measured its first position the current step paints its own fill.
 */
export function ConsultationStepNav({
  steps,
  current,
  filled,
  onSelect,
}: {
  steps: ConsultationStep[];
  current: ConsultationStepId;
  filled?: (step: ConsultationStep) => number;
  onSelect: (id: ConsultationStepId) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const pillRef = useRef<HTMLLIElement>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      const pill = pillRef.current;
      if (!list || !pill) return;

      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      let placed = false;

      const place = (animate: boolean) => {
        const target = list.querySelector<HTMLElement>(CURRENT_STEP);
        if (!target || target.offsetWidth === 0) {
          gsap.set(pill, { autoAlpha: 0 });
          return;
        }
        const vars = {
          x: target.offsetLeft,
          y: target.offsetTop,
          width: target.offsetWidth,
          height: target.offsetHeight,
          autoAlpha: 1,
        };
        if (animate && placed && !reduceMotion) {
          gsap.to(pill, { ...vars, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        } else {
          gsap.set(pill, vars);
        }
        placed = true;
        list.dataset.pill = 'ready';
      };

      place(false);

      const stepObserver = new MutationObserver(() => {
        place(true);
        // A narrow track scrolls sideways, so keep the current step in view.
        list
          .querySelector<HTMLElement>(CURRENT_STEP)
          ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      });
      stepObserver.observe(list, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-current'],
      });

      const sizeObserver =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => place(false));
      sizeObserver?.observe(list);
      list.querySelectorAll('button').forEach((button) => sizeObserver?.observe(button));

      return () => {
        stepObserver.disconnect();
        sizeObserver?.disconnect();
      };
    },
    { scope: listRef, dependencies: [steps.length] }
  );

  return (
    <nav aria-label="Consultation steps" className="@container flex-none 2xl:col-span-full">
      <ol
        ref={listRef}
        className="group/steps bg-card ring-border relative flex h-10 [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-full p-1 ring-1 [&::-webkit-scrollbar]:hidden"
      >
        <li
          ref={pillRef}
          role="presentation"
          aria-hidden="true"
          className="bg-cta pointer-events-none absolute top-0 left-0 rounded-full opacity-0"
        />
        {steps.map((step) => {
          const isCurrent = step.id === current;
          const count = filled?.(step) ?? 0;
          const done = !isCurrent && count > 0;
          const tone = STEP_TONE[step.id];
          const Icon = done ? PiCheckLight : tone.icon;

          return (
            <li key={step.id} className="flex h-full flex-1">
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={cn(
                  'focus-visible:ring-ring/50 relative z-10 flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300 outline-none focus-visible:ring-3 @max-3xl:gap-1.5 @max-3xl:px-2.5',
                  isCurrent
                    ? 'bg-cta text-cta-foreground group-data-[pill=ready]/steps:bg-transparent'
                    : 'text-muted-foreground hover:bg-foreground/6 hover:text-foreground'
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0',
                    !isCurrent && (done ? 'text-success' : tone.text),
                    // A narrow track keeps the labels: only the current step and done steps keep an icon.
                    !isCurrent && !done && '@max-3xl:hidden'
                  )}
                />
                {step.title}
                {filled && step.fields.length ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 font-mono text-xs tabular-nums',
                      isCurrent ? 'bg-cta-foreground/20' : 'bg-muted @max-4xl:hidden'
                    )}
                  >
                    {count}/{step.fields.length}
                    <span className="sr-only"> filled</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
