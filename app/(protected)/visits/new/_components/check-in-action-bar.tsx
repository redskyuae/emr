import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import { formatMoney } from '@/app/(protected)/billing/_utils/invoice-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { billingTotals } from '../_utils/billing-choice';

function invoiceSummary(totals: ReturnType<typeof billingTotals>) {
  if (totals.choice === 'none') return 'No Invoice';
  const charge = totals.charge === null ? 'Invoice' : `${formatMoney(totals.charge)} Invoice`;
  if (totals.choice === 'later') return `${charge} · pay later`;
  return `${charge} · ${formatMoney(totals.collected ?? 0)} now`;
}

export function CheckInActionBar({
  patientName,
  visitSummary,
  totals,
  showTotals,
  primaryLabel,
  primaryDisabled,
  busy,
  backDisabled,
  onBack,
  onPrimary,
}: {
  patientName: string | null;
  visitSummary: string | null;
  totals: ReturnType<typeof billingTotals>;
  showTotals: boolean;
  primaryLabel: string;
  primaryDisabled: boolean;
  busy: boolean;
  backDisabled: boolean;
  /** Present on the Visit step: returns to the Patient step instead of leaving Check-in. */
  onBack?: () => void;
  onPrimary: () => void;
}) {
  return (
    <Card className="acrylic shadow-fluent-16 fixed right-4 bottom-4 left-4 z-20 py-3 lg:left-[calc(var(--sidebar-width)+1rem)]">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2" aria-live="polite">
          {patientName ? <Badge variant="secondary">{patientName}</Badge> : null}
          {visitSummary ? <Badge variant="secondary">{visitSummary}</Badge> : null}
          {showTotals ? <Badge variant="secondary">{invoiceSummary(totals)}</Badge> : null}
          {showTotals && totals.balance ? (
            <Badge className="bg-warning/10 text-warning">
              {formatMoney(totals.balance)} Balance Due
            </Badge>
          ) : null}
        </div>
        <div className="ml-auto flex gap-2">
          {onBack ? (
            <Button type="button" variant="outline" disabled={backDisabled} onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild={!backDisabled} disabled={backDisabled}>
              {backDisabled ? <span>Cancel</span> : <Link href="/visits">Cancel</Link>}
            </Button>
          )}
          <Button type="button" disabled={primaryDisabled} aria-busy={busy} onClick={onPrimary}>
            <CheckCircle2 className="size-4" />
            {primaryLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
