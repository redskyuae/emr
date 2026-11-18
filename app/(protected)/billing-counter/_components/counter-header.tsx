import { RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { COUNTER_ENTITY, createSeedState } from '../_data/counter-seed';
import { formatAed } from '../_utils/money';
import { useCounter } from './counter-state';

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-sm' : 'truncate text-sm'}>{value}</dd>
    </div>
  );
}

export function CounterHeader() {
  const { state, shiftOpen, dispatch } = useCounter();
  const { shift } = state;

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-heading font-semibold">{COUNTER_ENTITY.legalName}</p>
            <p className="text-muted-foreground text-xs">
              Entity · {COUNTER_ENTITY.facility} · {COUNTER_ENTITY.currency} · VAT{' '}
              {COUNTER_ENTITY.vatRate}%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <Badge variant={shiftOpen ? 'default' : 'secondary'}>
              {shiftOpen ? 'Shift open' : 'Shift closed'} · {shift.counter}
            </Badge>
            <span className="text-muted-foreground text-xs">
              Shift {shift.no} · opened {shift.openedAt} · float AED {formatAed(shift.openingFloat)}{' '}
              · {shift.cashier}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: 'RESET', state: createSeedState() })}
            >
              <RotateCcw className="size-3.5" />
              Reset demo data
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t pt-3 md:grid-cols-4">
          <Fact label="TRN" value={COUNTER_ENTITY.trn} mono />
          <Fact label="Licence" value={COUNTER_ENTITY.licence} />
          <Fact label="Invoice series" value={COUNTER_ENTITY.invoiceSeries} mono />
          <Fact label="Claims via" value={COUNTER_ENTITY.claimsVia} />
        </dl>
      </CardContent>
    </Card>
  );
}
