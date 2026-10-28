import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { APPROVERS, COUNTER_CASHIER } from '../_data/counter-seed';
import { DEFAULT_OPENING_FLOAT, validateOpening } from '../_utils/counter-ledger';
import { formatAed } from '../_utils/money';
import { CounterField } from './counter-field';
import { useCounter } from './counter-state';

export function ShiftOpenPanel() {
  const { state, dispatch } = useCounter();
  const [basis, setBasis] = useState<'default' | 'custom'>('default');
  const [customFloat, setCustomFloat] = useState(0);
  const [authorizedBy, setAuthorizedBy] = useState('');

  const floatAmount = basis === 'default' ? DEFAULT_OPENING_FLOAT : customFloat;
  const errors = validateOpening({
    floatAmount,
    authorizedBy: basis === 'custom' ? authorizedBy : '',
  });

  function openShift() {
    dispatch({
      type: 'OPEN_SHIFT',
      floatAmount,
      cashier: COUNTER_CASHIER,
      authorizedBy: basis === 'custom' ? authorizedBy : null,
    });
    toast.success(`Shift ${state.shift.no + 1} opened with AED ${formatAed(floatAmount)} float.`);
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle className="text-base">Open next shift · {state.shift.counter}</CardTitle>
        <CardDescription>
          Set the opening cash float. The default needs no approval; any other amount needs an
          authorizing supervisor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={basis}
          onValueChange={(value) => setBasis(value as 'default' | 'custom')}
          className="gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="default" id="float-default" />
            <Label htmlFor="float-default">
              Default float · AED {formatAed(DEFAULT_OPENING_FLOAT)}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="custom" id="float-custom" />
            <Label htmlFor="float-custom">Authorized amount</Label>
          </div>
        </RadioGroup>

        {basis === 'custom' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <CounterField label="Opening float (AED)" htmlFor="float-amount" required>
              <Input
                id="float-amount"
                type="number"
                min={0}
                step="0.01"
                aria-required="true"
                className="text-right tabular-nums"
                value={customFloat || ''}
                onChange={(event) => setCustomFloat(Number(event.target.value) || 0)}
              />
            </CounterField>
            <CounterField label="Authorized by" htmlFor="float-approver" required>
              <NativeSelect
                id="float-approver"
                className="w-full"
                aria-required="true"
                value={authorizedBy}
                onChange={(event) => setAuthorizedBy(event.target.value)}
              >
                <option value="">Select…</option>
                {APPROVERS.map((approver) => (
                  <option key={approver} value={approver}>
                    {approver}
                  </option>
                ))}
              </NativeSelect>
            </CounterField>
          </div>
        ) : null}

        {errors.length > 0 ? (
          <ul className="text-warning space-y-1 text-xs">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <Button type="button" disabled={errors.length > 0} onClick={openShift}>
          Open shift
        </Button>
      </CardContent>
    </Card>
  );
}
