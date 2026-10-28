import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatAed } from '../_utils/money';
import type { LedgerTxn } from '../_utils/counter-types';
import { TXN_TYPE_CLASS, TXN_TYPE_LABEL, tenderSummary } from '../_utils/txn-presentation';

export function TxnTypeBadge({ type }: { type: LedgerTxn['type'] }) {
  return (
    <Badge variant="outline" className={TXN_TYPE_CLASS[type]}>
      {TXN_TYPE_LABEL[type]}
    </Badge>
  );
}

export function TenderChips({ txn }: { txn: LedgerTxn }) {
  const tenders = tenderSummary(txn);

  if (tenders.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
      {tenders.map((tender) => (
        <span key={tender.key} className="whitespace-nowrap tabular-nums">
          <span aria-hidden="true" className="bg-primary mr-1 inline-block size-1.5 rounded-full" />
          {tender.label} {formatAed(tender.amount)}
        </span>
      ))}
    </div>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('tabular-nums', value < 0 && 'text-destructive', className)}>
      {formatAed(value)}
    </span>
  );
}
