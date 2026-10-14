'use client';

import { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  SERVICE_OPTIONS,
  createConsultationLine,
  createEmptyServiceLine,
  formatMoney,
  netGrossForLine,
  type ServiceLine,
} from '../../_utils/pre-invoice';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function PreInvoiceSheet({
  open,
  patientName,
  mrn,
  dob,
  nationality,
  patientTypeLabel,
  visitModeLabel,
  visitModeId,
  departmentLabel,
  clinicianName,
  isFreeRevisit,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  patientName: string;
  mrn: string;
  dob: string;
  nationality: string;
  patientTypeLabel: string;
  visitModeLabel: string;
  visitModeId: string;
  departmentLabel: string;
  clinicianName: string;
  isFreeRevisit: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-2xl"
        style={{ width: 'min(720px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">Pre-invoice</SheetTitle>
          <SheetDescription>
            Review the Visit and Services before creating this Visit.
          </SheetDescription>
        </SheetHeader>
        {/* Rendered only while open so the Services table starts fresh each time,
            without an effect resetting state after render. */}
        {open ? (
          <PreInvoiceSheetBody
            patientName={patientName}
            mrn={mrn}
            dob={dob}
            nationality={nationality}
            patientTypeLabel={patientTypeLabel}
            visitModeLabel={visitModeLabel}
            visitModeId={visitModeId}
            departmentLabel={departmentLabel}
            clinicianName={clinicianName}
            isFreeRevisit={isFreeRevisit}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PreInvoiceSheetBody({
  patientName,
  mrn,
  dob,
  nationality,
  patientTypeLabel,
  visitModeLabel,
  visitModeId,
  departmentLabel,
  clinicianName,
  isFreeRevisit,
  onCancel,
  onConfirm,
}: {
  patientName: string;
  mrn: string;
  dob: string;
  nationality: string;
  patientTypeLabel: string;
  visitModeLabel: string;
  visitModeId: string;
  departmentLabel: string;
  clinicianName: string;
  isFreeRevisit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [lines, setLines] = useState<ServiceLine[]>(() => [
    createConsultationLine(visitModeLabel, visitModeId, isFreeRevisit),
  ]);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  function updateLine<K extends keyof ServiceLine>(id: string, key: K, value: ServiceLine[K]) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [key]: value } : line))
    );
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  const totalBaseGross = lines.reduce((sum, line) => sum + line.baseGross * line.quantity, 0);
  const totalNetGross = lines.reduce((sum, line) => sum + netGrossForLine(line), 0);
  const amountDue = Math.max(totalNetGross - advanceAmount, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Patient visit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <p className="font-heading text-sm font-semibold">{patientName}</p>
              <Badge variant="outline" className="font-mono">
                {mrn}
              </Badge>
            </div>
            <DetailField label="Patient type" value={patientTypeLabel} />
            <DetailField label="Visit mode" value={visitModeLabel} />
            <DetailField label="Department" value={departmentLabel || 'Not selected'} />
            <DetailField label="Clinician" value={clinicianName || 'Not selected'} />
            <DetailField label="Date of birth" value={dob || 'Not recorded'} />
            <DetailField label="Nationality" value={nationality || 'Not recorded'} />
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Services</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLines((current) => [...current, createEmptyServiceLine()])}
            >
              <Plus className="size-4" />
              Add service
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Sub-service</TableHead>
                  <TableHead>CPT</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Base gross</TableHead>
                  <TableHead className="text-right">Net gross</TableHead>
                  <TableHead className="w-9" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="min-w-36">
                      <NativeSelect
                        aria-label="Service"
                        value={line.service}
                        onChange={(event) => updateLine(line.id, 'service', event.target.value)}
                      >
                        {SERVICE_OPTIONS.map((option) => (
                          <NativeSelectOption key={option.value} value={option.value}>
                            {option.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell className="min-w-32">
                      <Input
                        aria-label="Sub-service"
                        value={line.subService}
                        onChange={(event) => updateLine(line.id, 'subService', event.target.value)}
                      />
                    </TableCell>
                    <TableCell className="min-w-24">
                      <Input
                        aria-label="CPT code"
                        value={line.cpt}
                        onChange={(event) => updateLine(line.id, 'cpt', event.target.value)}
                      />
                    </TableCell>
                    <TableCell className="w-24">
                      <Input
                        aria-label="Quantity"
                        type="number"
                        min="1"
                        step="1"
                        className="text-right"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.id, 'quantity', Number(event.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-28">
                      <Input
                        aria-label="Base gross"
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right"
                        value={line.baseGross}
                        onChange={(event) =>
                          updateLine(line.id, 'baseGross', Number(event.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 tabular-nums">
                        {line.waived ? <Badge variant="secondary">Free revisit</Badge> : null}
                        {formatMoney(netGrossForLine(line))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove service"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total base gross</span>
              <span className="tabular-nums">{formatMoney(totalBaseGross)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 font-medium">
              <span>Total net gross</span>
              <span className="tabular-nums">{formatMoney(totalNetGross)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span id="advance-amount-label" className="text-muted-foreground">
                Advance amount
              </span>
              <Input
                aria-labelledby="advance-amount-label"
                type="number"
                min="0"
                step="0.01"
                className="h-8 w-28 text-right"
                value={advanceAmount}
                onChange={(event) => setAdvanceAmount(Number(event.target.value) || 0)}
              />
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Amount due</span>
              <span className="tabular-nums">{formatMoney(amountDue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm}>
          <CheckCircle2 className="size-4" />
          Confirm &amp; Create Visit
        </Button>
      </SheetFooter>
    </div>
  );
}
