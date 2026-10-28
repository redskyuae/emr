'use client';

import { useState } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Lock } from 'lucide-react';

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

const TABS = [
  { value: 'invoice', label: 'New invoice' },
  { value: 'advance', label: 'Advance / deposit' },
  { value: 'refund', label: 'Refund' },
  { value: 'day-book', label: 'Day book' },
  { value: 'day-close', label: 'Day close' },
] as const;

const tabParser = parseAsStringLiteral(TABS.map((tab) => tab.value)).withDefault('invoice');

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
      <CounterHeader />

      {shiftOpen ? null : (
        <Alert>
          <Lock className="size-4" />
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

      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value as (typeof TABS)[number]['value'])}
      >
        <TabsList
          variant="line"
          className="w-full flex-wrap justify-start border-b group-data-horizontal/tabs:h-auto"
        >
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="flex-none px-3 py-2">
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
