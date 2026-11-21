'use client';

import { useState } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import type { IconType } from 'react-icons';
import { CiLock, CiReceipt, CiUndo, CiWallet } from 'react-icons/ci';
import { PiBookOpenLight } from 'react-icons/pi';

import { DemoDataBanner } from '@/components/app/demo-data-banner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COUNTER_PATIENTS } from '../_data/counter-seed';
import type { LedgerTxn } from '../_utils/counter-types';
import { DocumentDialog } from './_modals/document-dialog';
import { AdvanceTab } from './advance-tab';
import { CounterHeader } from './counter-header';
import { CounterProvider, useCounter } from './counter-state';
import { DayBookTab } from './day-book-tab';
import { DayCloseTab } from './day-close-tab';
import { NewInvoiceTab } from './new-invoice-tab';
import { RefundTab } from './refund-tab';

const TAB_VALUES = ['invoice', 'advance', 'refund', 'day-book', 'day-close'] as const;
type TabValue = (typeof TAB_VALUES)[number];

const TABS: readonly { value: TabValue; label: string; icon: IconType }[] = [
  { value: 'invoice', label: 'New invoice', icon: CiReceipt },
  { value: 'advance', label: 'Advance / deposit', icon: CiWallet },
  { value: 'refund', label: 'Refund', icon: CiUndo },
  { value: 'day-book', label: 'Day book', icon: PiBookOpenLight },
  { value: 'day-close', label: 'Day close', icon: CiLock },
];

const tabParser = parseAsStringLiteral(TAB_VALUES).withDefault('invoice');

function CounterWorkspace() {
  const { state, shiftOpen } = useCounter();
  const [tab, setTab] = useQueryState('tab', tabParser);
  const [visitParam] = useQueryState('visit');
  const [documentTxn, setDocumentTxn] = useState<LedgerTxn | null>(null);

  // "Bill at counter" on the Visit List arrives as ?visit=VST-1024.
  const prefillPatient = COUNTER_PATIENTS.find((patient) =>
    patient.visits.some((visit) => visit.number === visitParam)
  );

  return (
    <div className="space-y-4">
      <DemoDataBanner />

      <CounterHeader />

      {shiftOpen ? null : (
        <Alert>
          <CiLock className="size-4" />
          <AlertTitle>Shift {state.shift.no} is closed</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Posting is disabled until the next shift is opened.
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void setTab('day-close')}
            >
              Go to Day close
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={(value) => void setTab(value as TabValue)}>
        <TabsList className="max-w-full [scrollbar-width:none] justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="flex-none">
              <item.icon aria-hidden="true" />
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tabs stay mounted so a half-built Invoice survives a trip to the Day book. */}
        <TabsContent value="invoice" forceMount className="data-[state=inactive]:hidden">
          <NewInvoiceTab
            key={prefillPatient?.mrn ?? 'blank'}
            initialMrn={prefillPatient?.mrn ?? ''}
            initialVisit={visitParam ?? 'none'}
            onPosted={setDocumentTxn}
          />
        </TabsContent>
        <TabsContent value="advance" forceMount className="data-[state=inactive]:hidden">
          <AdvanceTab onPosted={setDocumentTxn} />
        </TabsContent>
        <TabsContent value="refund" forceMount className="data-[state=inactive]:hidden">
          <RefundTab onPosted={setDocumentTxn} />
        </TabsContent>
        <TabsContent value="day-book">
          <DayBookTab />
        </TabsContent>
        <TabsContent value="day-close">
          <DayCloseTab />
        </TabsContent>
      </Tabs>

      <DocumentDialog txn={documentTxn} onClose={() => setDocumentTxn(null)} />
    </div>
  );
}

export function BillingCounterPageImpl() {
  return (
    <CounterProvider>
      <CounterWorkspace />
    </CounterProvider>
  );
}
