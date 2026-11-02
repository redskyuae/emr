import { AlertCircle, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { formatAed } from '../_utils/money';
import type { TenderInput, TenderMethod } from '../_utils/counter-types';
import { COUNTER_ENABLED_METHODS } from '../_data/counter-seed';
import {
  COLLECTION_METHODS,
  TENDER_META,
  newTender,
  tenderFieldValue,
  withTenderField,
  type TenderField,
  type TenderFieldKey,
  type validateTenders,
} from '../_utils/tender';

type Validation = ReturnType<typeof validateTenders>;

function TenderFieldInput({
  field,
  tenderKey,
  value,
  onChange,
}: {
  field: TenderField;
  tenderKey: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `${tenderKey}-${field.key}`;

  return (
    <div className={cn('space-y-1', field.kind === 'date' && 'sm:col-span-1')}>
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {field.label}
        {field.required ? (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {field.kind === 'select' ? (
        <NativeSelect
          id={id}
          size="sm"
          className="w-full"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
      ) : (
        <Input
          id={id}
          className="h-8"
          type={field.kind === 'date' ? 'date' : 'text'}
          inputMode={field.kind === 'digits' ? 'numeric' : undefined}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          aria-required={field.required || undefined}
          value={value}
          onChange={(event) =>
            onChange(
              field.kind === 'digits' ? event.target.value.replace(/\D/g, '') : event.target.value
            )
          }
        />
      )}
    </div>
  );
}

function TenderRow({
  tender,
  applied,
  change,
  advanceBalance,
  onChange,
  onField,
  onRemove,
}: {
  tender: TenderInput;
  applied: number;
  change: number;
  advanceBalance: number;
  onChange: (patch: Partial<TenderInput>) => void;
  onField: (key: TenderFieldKey, value: string) => void;
  onRemove: () => void;
}) {
  const meta = TENDER_META[tender.method];
  const isCash = tender.method === 'CASH';
  const amountId = `${tender.key}-amount`;

  return (
    <div className="space-y-2 rounded-md border p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{meta.label}</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label={`Remove ${meta.label}`}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={amountId} className="text-muted-foreground text-xs">
            {isCash ? 'Cash handed over' : 'Amount'}
          </Label>
          <Input
            id={amountId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="h-8 text-right tabular-nums"
            value={(isCash ? tender.tendered : tender.amount) || ''}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              onChange(isCash ? { tendered: value } : { amount: value });
            }}
          />
        </div>

        {meta.fields.map((field) => (
          <TenderFieldInput
            key={field.key}
            field={field}
            tenderKey={tender.key}
            value={tenderFieldValue(tender, field.key)}
            onChange={(value) => onField(field.key, value)}
          />
        ))}
      </div>

      {isCash && tender.tendered > 0 ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          Applied AED {formatAed(applied)}
          {change > 0 ? (
            <>
              {' · '}
              <span className="text-foreground font-medium">Change AED {formatAed(change)}</span>
            </>
          ) : null}
        </p>
      ) : null}
      {tender.method === 'ADVANCE' ? (
        <p className="text-muted-foreground text-xs tabular-nums">
          Available AED {formatAed(advanceBalance)}
        </p>
      ) : null}
    </div>
  );
}

export function TenderPanel({
  title,
  subtitle,
  dueLabel,
  due,
  tenders,
  validation,
  extraErrors,
  advanceBalance,
  allowAdvance,
  outstanding,
  advanceAuto,
  submitLabel,
  onTendersChange,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  dueLabel: string;
  due: number;
  tenders: TenderInput[];
  validation: Validation;
  extraErrors: string[];
  advanceBalance: number;
  allowAdvance: boolean;
  outstanding?: { checked: boolean; onChange: (checked: boolean) => void };
  advanceAuto?: { checked: boolean; onChange: (checked: boolean) => void; amount: number };
  submitLabel: string;
  onTendersChange: (tenders: TenderInput[]) => void;
  onSubmit: () => void;
}) {
  const errors = [...extraErrors, ...validation.errors];
  const offerAdvance = allowAdvance && advanceBalance > 0 && !advanceAuto?.checked;
  const collectionMethods = COLLECTION_METHODS.filter((method) =>
    COUNTER_ENABLED_METHODS.includes(method)
  );
  const methods: TenderMethod[] = offerAdvance
    ? [...collectionMethods, 'ADVANCE']
    : collectionMethods;
  // Auto-applied Advance is prepended to the validated tenders, so shift the index.
  const resolvedOffset = validation.resolved.length - tenders.length;

  function patchTender(key: string, patch: Partial<TenderInput>) {
    onTendersChange(
      tenders.map((tender) => (tender.key === key ? { ...tender, ...patch } : tender))
    );
  }

  return (
    <Card className="shadow-fluent-4 h-fit">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-sm">{dueLabel}</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">
            AED {formatAed(due)}
          </span>
        </div>

        {advanceAuto && advanceBalance > 0 ? (
          <div className="bg-accent/50 space-y-1 rounded-md border p-2.5">
            <div className="flex items-start gap-2">
              <Checkbox
                id="auto-advance"
                checked={advanceAuto.checked}
                onCheckedChange={(checked) => advanceAuto.onChange(checked === true)}
              />
              <Label htmlFor="auto-advance" className="text-xs leading-snug">
                Apply the Patient&apos;s advance automatically
              </Label>
            </div>
            <p className="text-muted-foreground text-xs tabular-nums">
              {!advanceAuto.checked
                ? `AED ${formatAed(advanceBalance)} available. Switch on, or add Advance below, to use it.`
                : advanceAuto.amount > 0
                  ? `AED ${formatAed(advanceAuto.amount)} applied from AED ${formatAed(advanceBalance)} · balance after AED ${formatAed(advanceBalance - advanceAuto.amount)}`
                  : `AED ${formatAed(advanceBalance)} available. It is applied once there are charges.`}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Choose how the Patient is paying. Add more than one method to split the payment.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {methods.map((method) => (
              <Button
                key={method}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onTendersChange([...tenders, newTender(method)])}
              >
                <Plus className="size-3.5" />
                {TENDER_META[method].label}
              </Button>
            ))}
          </div>
        </div>

        {tenders.length > 0 ? (
          <div className="space-y-2">
            {tenders.map((tender, index) => (
              <TenderRow
                key={tender.key}
                tender={tender}
                applied={validation.resolved[index + resolvedOffset]?.amount ?? 0}
                change={validation.resolved[index + resolvedOffset]?.change ?? 0}
                advanceBalance={advanceBalance}
                onChange={(patch) => patchTender(tender.key, patch)}
                onField={(key, value) =>
                  onTendersChange(
                    tenders.map((item) =>
                      item.key === tender.key ? withTenderField(item, key, value) : item
                    )
                  )
                }
                onRemove={() => onTendersChange(tenders.filter((item) => item.key !== tender.key))}
              />
            ))}
          </div>
        ) : null}

        <dl className="space-y-1 border-t pt-3 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Collected</dt>
            <dd>AED {formatAed(validation.paid)}</dd>
          </div>
          {validation.change > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Change to return</dt>
              <dd>AED {formatAed(validation.change)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between font-medium">
            <dt>Balance remaining</dt>
            <dd className={cn(validation.remaining > 0 ? 'text-destructive' : 'text-success')}>
              AED {formatAed(validation.remaining)}
            </dd>
          </div>
        </dl>

        {outstanding ? (
          <div className="flex items-start gap-2">
            <Checkbox
              id="leave-outstanding"
              checked={outstanding.checked}
              onCheckedChange={(checked) => outstanding.onChange(checked === true)}
            />
            <Label
              htmlFor="leave-outstanding"
              className="text-muted-foreground text-xs leading-snug"
            >
              Leave the remaining balance as outstanding on the Patient&apos;s account
            </Label>
          </div>
        ) : null}

        {errors.length > 0 ? (
          <ul
            aria-label="Before you can post"
            className="bg-warning/10 border-warning/30 text-warning space-y-1 rounded-md border p-2.5 text-xs"
          >
            {errors.map((error) => (
              <li key={error} className="flex items-start gap-1.5">
                <AlertCircle className="mt-px size-3.5 shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        ) : null}

        <Button type="button" className="w-full" disabled={errors.length > 0} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
