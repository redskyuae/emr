'use client';

import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';

import { dateTimeIn } from '../_utils/visit-summary-format';
import { latestConsultationNote, otherClinicalNotes } from '../_utils/visit-summary-notes';
import { paginate } from '../_utils/visit-summary-pages';
import { SummaryBilling, SummaryMedicationsAndFollowUp, SummaryTreatment } from './summary-care';
import { SummaryAllergies, SummaryDiagnoses, SummaryVitals } from './summary-clinical';
import { type SummaryBlock, clinicalNoteBlocks, consultationBlocks } from './summary-notes';
import {
  SummaryFooter,
  SummaryLetterhead,
  SummaryPage,
  SummaryRunningHeader,
} from './summary-page-chrome';
import { SummaryPatientCard, SummaryStateBanner } from './summary-patient-card';

// A4 is 210mm (794px at 96 dpi); narrower screens shrink the sheet to fit.
const A4_WIDTH_PX = 794;

function summaryBlocks(summary: VisitSummary): SummaryBlock[] {
  const blocks: SummaryBlock[] = [
    { key: 'patient', spacing: 'section', node: <SummaryPatientCard summary={summary} /> },
  ];
  const push = (key: string, node: ReactNode) => blocks.push({ key, spacing: 'section', node });

  if (summary.visit.status !== 'COMPLETED') {
    push('state', <SummaryStateBanner summary={summary} />);
  }

  // A cancelled Visit prints who, when and why only.
  if (summary.visit.status === 'CANCELLED') return blocks;

  push('allergies', <SummaryAllergies allergies={summary.allergies} />);

  if (summary.vitalSign) {
    push('vitals', <SummaryVitals vitalSign={summary.vitalSign} timeZone={summary.timeZone} />);
  }

  const consultation = latestConsultationNote(summary.notes);
  if (consultation || summary.visit.chiefComplaint) {
    blocks.push(
      ...consultationBlocks({
        note: consultation,
        chiefComplaint: summary.visit.chiefComplaint,
        timeZone: summary.timeZone,
      })
    );
  }

  if (summary.diagnoses.length > 0) {
    push('diagnoses', <SummaryDiagnoses diagnoses={summary.diagnoses} />);
  }

  blocks.push(
    ...clinicalNoteBlocks({
      notes: otherClinicalNotes(summary.notes),
      timeZone: summary.timeZone,
    })
  );

  if (summary.treatmentGiven || summary.treatmentPlans.length > 0) {
    push('treatment', <SummaryTreatment summary={summary} />);
  }

  push(
    'medications',
    <SummaryMedicationsAndFollowUp
      summary={summary}
      printedOn={dateTimeIn(summary.generatedAt, summary.timeZone).split(' ')[0]}
    />
  );

  if (summary.billing) {
    push('billing', <SummaryBilling billing={summary.billing} timeZone={summary.timeZone} />);
  }

  return blocks;
}

const BLOCK_SPACING: Record<SummaryBlock['spacing'], string> = {
  section: 'pt-[18px]',
  group: 'pt-3.5',
  row: 'pt-1.5',
};

// Each block carries its own top spacing, so a measured height is exactly the room it takes.
function BlockFrame({
  spacing,
  children,
}: {
  spacing: SummaryBlock['spacing'];
  children: ReactNode;
}) {
  return (
    <div data-summary-block className={BLOCK_SPACING[spacing]}>
      {children}
    </div>
  );
}

// Printed above a block that opens a later page; padded, not margined, so it measures whole.
function ContinuedFrame({ index, children }: { index?: number; children: ReactNode }) {
  return (
    <div data-summary-continued={index} className="pb-1.5">
      {children}
    </div>
  );
}

function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => setScale(Math.min(1, element.clientWidth / A4_WIDTH_PX));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, scale };
}

/**
 * The Patient copy laid out on A4 pages. Blocks are measured off-screen, then packed onto pages
 * so the screen preview and the printed copy break in the same places.
 */
export function VisitSummarySheet({ summary }: { summary: VisitSummary }) {
  const blocks = summaryBlocks(summary);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][] | null>(null);
  const { ref: fitRef, scale } = useFitScale();

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;

    const height = (element: Element | null) => element?.getBoundingClientRect().height ?? 0;
    const firstPage = height(root.querySelector('[data-measure="first"]'));
    const laterPage = height(root.querySelector('[data-measure="later"]'));
    const blockHeights = [...root.querySelectorAll('[data-summary-block]')].map(height);
    const continuedHeights: number[] = [];
    root.querySelectorAll<HTMLElement>('[data-summary-continued]').forEach((element) => {
      continuedHeights[Number(element.dataset.summaryContinued)] = height(element);
    });

    setPages(paginate(blockHeights, firstPage, laterPage, continuedHeights));
  }, []);

  useLayoutEffect(() => {
    measure();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure, summary]);

  const pageCount = pages?.length ?? 1;

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden="true"
        inert
        className="pointer-events-none invisible fixed top-0 left-[-10000px]"
      >
        <SummaryPage
          header={<SummaryLetterhead summary={summary} />}
          footer={<SummaryFooter summary={summary} page={1} pageCount={1} />}
        >
          <div data-measure="first" className="h-full" />
        </SummaryPage>
        <SummaryPage
          header={<SummaryRunningHeader summary={summary} />}
          footer={<SummaryFooter summary={summary} page={2} pageCount={2} />}
        >
          <div data-measure="later" className="h-full" />
        </SummaryPage>
        <div className="w-[210mm] px-12">
          {blocks.map((block) => (
            <BlockFrame key={block.key} spacing={block.spacing}>
              {block.node}
            </BlockFrame>
          ))}
          {blocks.map((block, index) =>
            block.continued ? (
              <ContinuedFrame key={block.key} index={index}>
                {block.continued}
              </ContinuedFrame>
            ) : null
          )}
        </div>
      </div>

      <div ref={fitRef} className="w-full min-w-0">
        <div
          data-visit-summary
          className="mx-auto flex w-fit flex-col gap-6 print:[zoom:1]! print:gap-0"
          style={{ zoom: scale }}
        >
          {(pages ?? [blocks.map((_, index) => index)]).map((indexes, pageIndex) => (
            <SummaryPage
              key={pageIndex}
              className="border-border border print:border-0"
              header={
                pageIndex === 0 ? (
                  <SummaryLetterhead summary={summary} />
                ) : (
                  <SummaryRunningHeader summary={summary} />
                )
              }
              footer={
                <SummaryFooter summary={summary} page={pageIndex + 1} pageCount={pageCount} />
              }
            >
              {indexes.map((index, position) => (
                <BlockFrame key={blocks[index].key} spacing={blocks[index].spacing}>
                  {pageIndex > 0 && position === 0 && blocks[index].continued ? (
                    <ContinuedFrame>{blocks[index].continued}</ContinuedFrame>
                  ) : null}
                  {blocks[index].node}
                </BlockFrame>
              ))}
            </SummaryPage>
          ))}
        </div>
      </div>
    </>
  );
}
