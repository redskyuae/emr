import { useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildBankBook,
  buildCashBook,
  buildSalesBook,
  computeDayTotals,
} from '../_utils/counter-ledger';
import { formatAed } from '../_utils/money';
import type { LedgerTxn, TenderMethod, TxnType } from '../_utils/counter-types';
import { TENDER_META, describeTender } from '../_utils/tender';
import { TXN_TYPE_LABEL } from '../_utils/txn-presentation';
import { useCounter } from './counter-state';
import { Money, TenderChips, TxnTypeBadge } from './txn-cells';

function BookTable({
  columns,
  footer,
  empty,
  children,
}: {
  columns: { label: string; align?: 'right' }[];
  footer?: ReactNode;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left text-xs">
              {columns.map((column, index) => (
                <th
                  key={column.label}
                  className={`p-2 font-medium ${index === 0 ? 'pl-4' : ''} ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
            {empty ? (
              <tr>
                <td colSpan={columns.length} className="text-muted-foreground p-6 text-center">
                  Nothing posted for these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
          {footer ? <tfoot className="bg-muted/40 border-t font-medium">{footer}</tfoot> : null}
        </table>
      </CardContent>
    </Card>
  );
}

function TransactionBook({ txns }: { txns: LedgerTxn[] }) {
  const [type, setType] = useState<TxnType | ''>('');
  const [method, setMethod] = useState<TenderMethod | ''>('');
  const [search, setSearch] = useState('');

  const needle = search.trim().toLowerCase();
  const rows = txns
    .filter((txn) => !type || txn.type === type)
    .filter((txn) => !method || txn.tenders.some((tender) => tender.method === method))
    .filter(
      (txn) =>
        !needle ||
        [txn.number, txn.patientName, txn.patientMrn, txn.receiptNumber ?? ''].some((value) =>
          value.toLowerCase().includes(needle)
        )
    )
    .sort((a, b) => b.time.localeCompare(a.time));
  const net = rows.reduce((total, txn) => total + txn.patientPaid, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="bg-background shadow-fluent-2 h-9 sm:max-w-xs">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search number, receipt, Patient or MRN…"
            aria-label="Search transactions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <NativeSelect
          aria-label="Filter by transaction type"
          value={type}
          onChange={(event) => setType(event.target.value as TxnType | '')}
        >
          <option value="">All types</option>
          {(Object.keys(TXN_TYPE_LABEL) as TxnType[]).map((key) => (
            <option key={key} value={key}>
              {TXN_TYPE_LABEL[key]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Filter by payment method"
          value={method}
          onChange={(event) => setMethod(event.target.value as TenderMethod | '')}
        >
          <option value="">All methods</option>
          {(Object.keys(TENDER_META) as TenderMethod[]).map((key) => (
            <option key={key} value={key}>
              {TENDER_META[key].label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <BookTable
        empty={rows.length === 0}
        columns={[
          { label: 'Time' },
          { label: 'Reference' },
          { label: 'Type' },
          { label: 'Patient' },
          { label: 'Receipt' },
          { label: 'Tenders' },
          { label: 'Amount (AED)', align: 'right' },
        ]}
        footer={
          <tr>
            <td colSpan={6} className="p-2 pl-4">
              Net patient receipts · {rows.length} entries
            </td>
            <td className="p-2 text-right">
              <Money value={net} />
            </td>
          </tr>
        }
      >
        {rows.map((txn) => (
          <tr key={txn.id} className="hover:bg-muted/50 border-b last:border-b-0">
            <td className="p-2 pl-4 tabular-nums">{txn.time}</td>
            <td className="p-2 font-mono text-xs">{txn.number}</td>
            <td className="p-2">
              <TxnTypeBadge type={txn.type} />
            </td>
            <td className="p-2">
              {txn.patientName}
              <span className="text-muted-foreground block font-mono text-xs">
                {txn.patientMrn}
              </span>
            </td>
            <td className="p-2 font-mono text-xs">{txn.receiptNumber ?? '—'}</td>
            <td className="p-2">
              <TenderChips txn={txn} />
            </td>
            <td className="p-2 text-right">
              <Money value={txn.patientPaid} />
            </td>
          </tr>
        ))}
      </BookTable>
    </div>
  );
}

function CashBook() {
  const { state } = useCounter();
  const txns = state.ledger.filter((txn) => txn.shiftNo === state.shift.no);
  const book = buildCashBook(state.shift, txns);
  const totalIn = book.rows.reduce((total, row) => total + row.cashIn, 0);
  const totalOut = book.rows.reduce((total, row) => total + row.cashOut, 0);

  return (
    <BookTable
      empty={false}
      columns={[
        { label: 'Time' },
        { label: 'Reference' },
        { label: 'Patient' },
        { label: 'Type' },
        { label: 'Cash in', align: 'right' },
        { label: 'Cash out', align: 'right' },
        { label: 'Balance', align: 'right' },
      ]}
      footer={
        <tr>
          <td colSpan={4} className="p-2 pl-4">
            Closing cash
          </td>
          <td className="p-2 text-right">
            <Money value={totalIn} />
          </td>
          <td className="p-2 text-right">
            <Money value={totalOut} />
          </td>
          <td className="p-2 text-right">
            <Money value={book.closing} />
          </td>
        </tr>
      }
    >
      <tr className="bg-muted/30 border-b">
        <td className="p-2 pl-4 tabular-nums">{state.shift.openedAt}</td>
        <td className="p-2" colSpan={5}>
          Opening float · {state.shift.counter}
        </td>
        <td className="p-2 text-right">
          <Money value={book.opening} />
        </td>
      </tr>
      {book.rows.map(({ txn, cashIn, cashOut, balance }) => (
        <tr key={txn.id} className="hover:bg-muted/50 border-b last:border-b-0">
          <td className="p-2 pl-4 tabular-nums">{txn.time}</td>
          <td className="p-2 font-mono text-xs">{txn.number}</td>
          <td className="p-2">{txn.patientName}</td>
          <td className="p-2">
            <TxnTypeBadge type={txn.type} />
          </td>
          <td className="p-2 text-right">{cashIn > 0 ? <Money value={cashIn} /> : ''}</td>
          <td className="p-2 text-right">{cashOut > 0 ? <Money value={cashOut} /> : ''}</td>
          <td className="p-2 text-right">
            <Money value={balance} />
          </td>
        </tr>
      ))}
    </BookTable>
  );
}

function BankBook({ txns }: { txns: LedgerTxn[] }) {
  const rows = buildBankBook(txns);
  const receipts = rows.reduce((total, row) => total + row.receipt, 0);
  const payments = rows.reduce((total, row) => total + row.payment, 0);

  return (
    <BookTable
      empty={rows.length === 0}
      columns={[
        { label: 'Time' },
        { label: 'Reference' },
        { label: 'Patient' },
        { label: 'Method' },
        { label: 'Instrument' },
        { label: 'Receipts', align: 'right' },
        { label: 'Payments', align: 'right' },
      ]}
      footer={
        <tr>
          <td colSpan={5} className="p-2 pl-4">
            Net bank movement · {formatAed(receipts - payments)}
          </td>
          <td className="p-2 text-right">
            <Money value={receipts} />
          </td>
          <td className="p-2 text-right">
            <Money value={payments} />
          </td>
        </tr>
      }
    >
      {rows.map(({ txn, tender, receipt, payment }) => (
        <tr
          key={`${txn.id}-${tender.method}-${tender.reference}`}
          className="hover:bg-muted/50 border-b last:border-b-0"
        >
          <td className="p-2 pl-4 tabular-nums">{txn.time}</td>
          <td className="p-2 font-mono text-xs">{txn.number}</td>
          <td className="p-2">{txn.patientName}</td>
          <td className="p-2">
            <Badge variant="secondary">{TENDER_META[tender.method].label}</Badge>
          </td>
          <td className="p-2 text-xs">{describeTender(tender) || '—'}</td>
          <td className="p-2 text-right">{receipt > 0 ? <Money value={receipt} /> : ''}</td>
          <td className="p-2 text-right">{payment > 0 ? <Money value={payment} /> : ''}</td>
        </tr>
      ))}
    </BookTable>
  );
}

function SalesBook({ txns }: { txns: LedgerTxn[] }) {
  const book = buildSalesBook(txns);

  return (
    <BookTable
      empty={book.rows.length === 0}
      columns={[
        { label: 'Time' },
        { label: 'Reference' },
        { label: 'Patient' },
        { label: 'Taxable', align: 'right' },
        { label: 'VAT', align: 'right' },
        { label: 'Total', align: 'right' },
        { label: 'Patient share', align: 'right' },
        { label: 'Payer share', align: 'right' },
      ]}
      footer={
        <tr>
          <td colSpan={3} className="p-2 pl-4">
            Net sales
          </td>
          <td className="p-2 text-right">
            <Money value={book.taxable} />
          </td>
          <td className="p-2 text-right">
            <Money value={book.vat} />
          </td>
          <td className="p-2 text-right">
            <Money value={book.total} />
          </td>
          <td className="p-2 text-right">
            <Money value={book.patientShare} />
          </td>
          <td className="p-2 text-right">
            <Money value={book.payerShare} />
          </td>
        </tr>
      }
    >
      {book.rows.map((txn) => (
        <tr key={txn.id} className="hover:bg-muted/50 border-b last:border-b-0">
          <td className="p-2 pl-4 tabular-nums">{txn.time}</td>
          <td className="p-2 font-mono text-xs">
            {txn.number}
            {txn.type === 'CREDIT_NOTE' ? <TxnTypeBadge type={txn.type} /> : null}
          </td>
          <td className="p-2">{txn.patientName}</td>
          <td className="p-2 text-right">
            <Money value={txn.taxable} />
          </td>
          <td className="p-2 text-right">
            <Money value={txn.vat} />
          </td>
          <td className="p-2 text-right">
            <Money value={txn.total} />
          </td>
          <td className="p-2 text-right">
            <Money value={txn.type === 'INVOICE' ? txn.total - txn.payerShare : txn.total} />
          </td>
          <td className="p-2 text-right">
            {txn.payerShare > 0 ? <Money value={txn.payerShare} /> : ''}
          </td>
        </tr>
      ))}
    </BookTable>
  );
}

export function DayBookTab() {
  const { state } = useCounter();
  const txns = state.ledger.filter((txn) => txn.shiftNo === state.shift.no);
  const totals = computeDayTotals(txns);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Shift {state.shift.no} · {state.shift.counter} · {txns.length} entries · {totals.invoices}{' '}
        Invoices. Expenses and supplier payments will post to these books once Accounts Payable is
        connected.
      </p>
      <Tabs defaultValue="transactions">
        <TabsList className="flex-wrap group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="transactions">Transaction book</TabsTrigger>
          <TabsTrigger value="cash">Cash book</TabsTrigger>
          <TabsTrigger value="bank">Bank book</TabsTrigger>
          <TabsTrigger value="sales">Sales book</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <TransactionBook txns={txns} />
        </TabsContent>
        <TabsContent value="cash">
          <CashBook />
        </TabsContent>
        <TabsContent value="bank">
          <BankBook txns={txns} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesBook txns={txns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
