'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { CreateInvoiceRequest } from '@/app/api/v1/invoices/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAddInvoiceLine } from '@/app/queries/billing/invoices/useAddInvoiceLine';
import { useCreateInvoice } from '@/app/queries/billing/invoices/useCreateInvoice';
import { useFinalizeInvoice } from '@/app/queries/billing/invoices/useFinalizeInvoice';
import { useRecordPayment } from '@/app/queries/billing/invoices/useRecordPayment';
import { useUpdateDraftInvoice } from '@/app/queries/billing/invoices/useUpdateDraftInvoice';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormValues,
} from '../_utils/create-invoice-form-schema';
import { formatMoney } from '../_utils/invoice-display';
import {
  invoiceComposerTotals,
  resolveComposerTenders,
  roundAmount,
  type ComposerLine,
  type ComposerTender,
} from '../_utils/invoice-composer';
import { ComposerChargesCard } from './composer-charges-card';
import { ComposerPatientCard } from './composer-patient-card';
import { ComposerPaymentCard } from './composer-payment-card';

export function InvoiceComposer() {
  const router = useRouter();
  const [patientIdParam] = useQueryState('patientId');
  const [visitIdParam] = useQueryState('visitId');
  const [admissionIdParam] = useQueryState('admissionId');
  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceFormSchema),
    mode: 'onTouched',
    defaultValues: {
      patientId: '',
      encounterKind: 'none',
      visitId: '',
      admissionId: '',
      notes: '',
    },
  });
  const { reset } = form;
  const [lines, setLines] = useState<ComposerLine[]>([]);
  const [tenders, setTenders] = useState<ComposerTender[]>([]);
  const [discountInput, setDiscountInput] = useState('0');
  const [outstanding, setOutstanding] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createMutation = useCreateInvoice();
  const addLineMutation = useAddInvoiceLine();
  const updateMutation = useUpdateDraftInvoice();
  const finalizeMutation = useFinalizeInvoice();
  const paymentMutation = useRecordPayment();
  const { data: canUpdate } = useHasPermission('invoice:update');
  const { data: canFinalize } = useHasPermission('invoice:finalize');
  const { data: canRecordPayment } = useHasPermission('payment:record');

  useEffect(() => {
    const patientId = patientIdParam && /^\d+$/.test(patientIdParam) ? patientIdParam : '';
    const visitId = visitIdParam && /^\d+$/.test(visitIdParam) ? visitIdParam : '';
    const admissionId = admissionIdParam && /^\d+$/.test(admissionIdParam) ? admissionIdParam : '';
    reset({
      patientId,
      encounterKind: visitId ? 'visit' : admissionId ? 'admission' : 'none',
      visitId,
      admissionId,
      notes: '',
    });
  }, [patientIdParam, visitIdParam, admissionIdParam, reset]);

  const discount = Number(discountInput);
  const totals = invoiceComposerTotals(lines, Number.isFinite(discount) ? discount : 0);
  const payment = resolveComposerTenders(tenders, totals.grandTotal);
  const chargeError = lines.find(
    (line) =>
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 100_000 ||
      !Number.isFinite(line.unitPrice) ||
      line.unitPrice < 0 ||
      roundAmount(line.unitPrice) !== line.unitPrice
  )
    ? 'Each Charge must have a whole quantity of at least 1 and a valid unit price with at most two decimals.'
    : '';
  const discountError =
    !Number.isFinite(discount) ||
    discount < 0 ||
    roundAmount(discount) !== discount ||
    discount > totals.subtotal
      ? 'Discount must be between zero and the subtotal, with at most two decimals.'
      : '';
  const editError =
    (lines.length > 0 || discount > 0) && !canUpdate
      ? 'You need Invoice update permission to add Charges or a Discount.'
      : '';
  const postError =
    lines.length === 0
      ? 'Add at least one Charge Item before posting.'
      : editError
        ? editError
        : !canFinalize
          ? 'You need Invoice finalize permission to post.'
          : tenders.length > 0 && !canRecordPayment
            ? 'You need Payment record permission to collect a Payment.'
            : (payment.errors[0] ??
              (payment.remaining > 0 && !outstanding
                ? 'Collect the full amount or confirm the Balance Due.'
                : ''));

  async function save(values: CreateInvoiceFormValues, post: boolean) {
    setSubmitError('');
    if (chargeError || discountError || editError || (post && postError)) return;

    const request: CreateInvoiceRequest = {
      patientId: Number(values.patientId),
      visitId: values.encounterKind === 'visit' ? Number(values.visitId) : undefined,
      admissionId: values.encounterKind === 'admission' ? Number(values.admissionId) : undefined,
      notes: values.notes || undefined,
    };

    setSubmitting(true);
    try {
      const created = await createMutation.mutateAsync(request);
      const id = created.data.id;
      setCreatedId(id);
      for (const line of lines) {
        await addLineMutation.mutateAsync({
          id,
          request: {
            chargeItemId: line.chargeItemId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          },
        });
      }
      if (discount > 0) {
        await updateMutation.mutateAsync({
          id,
          request: { discountAmount: discount, notes: values.notes || undefined },
        });
      }
      if (post) {
        await finalizeMutation.mutateAsync(id);
        let receiptId: number | null = null;
        for (const tender of payment.resolved) {
          const recorded = await paymentMutation.mutateAsync({
            id,
            request: {
              amount: tender.amount,
              method: tender.method,
              reference: tender.reference.trim() || undefined,
            },
          });
          receiptId = recorded.data.payment.id;
        }
        toast.success(receiptId ? 'Invoice posted and Payment recorded.' : 'Invoice finalized.');
        router.push(`/billing/${id}${receiptId ? `?receipt=${receiptId}` : ''}`);
      } else {
        toast.success('Draft Invoice saved.');
        router.push(`/billing/${id}`);
      }
    } catch (error) {
      const message = getApiErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <div className="bg-card shadow-fluent-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Back to Invoices">
              <Link href="/billing">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">New Invoice</h1>
              <p className="text-muted-foreground text-sm">
                Select a Patient, add Charges, and collect Payment.
              </p>
            </div>
          </div>
        </div>

        {submitError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not finish the Invoice</AlertTitle>
            <AlertDescription>
              {submitError}
              {createdId ? (
                <>
                  {' '}
                  The Invoice was created.{' '}
                  <Link className="underline" href={`/billing/${createdId}`}>
                    Continue with it here
                  </Link>
                  .
                </>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <form
          onSubmit={(event) => event.preventDefault()}
          className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <div className="space-y-4">
            <ComposerPatientCard />
            <ComposerChargesCard lines={lines} onChange={setLines} />
            <Card className="shadow-fluent-2">
              <CardHeader>
                <CardTitle className="text-base">Invoice details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(discountError)}>
                    <FieldLabel htmlFor="composer-discount">Discount amount</FieldLabel>
                    <Input
                      id="composer-discount"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={discountInput}
                      onChange={(event) => setDiscountInput(event.target.value)}
                    />
                    {discountError ? <FieldError>{discountError}</FieldError> : null}
                  </Field>
                  <div className="space-y-1 text-sm tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Grand total</span>
                      <span>{formatMoney(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
                <Field data-invalid={Boolean(form.formState.errors.notes)}>
                  <FieldLabel htmlFor="composer-notes">Notes</FieldLabel>
                  <Textarea
                    id="composer-notes"
                    rows={2}
                    placeholder="Optional billing notes"
                    {...form.register('notes')}
                  />
                  {form.formState.errors.notes ? (
                    <FieldError>{form.formState.errors.notes.message}</FieldError>
                  ) : null}
                </Field>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <ComposerPaymentCard
              due={totals.grandTotal}
              tenders={tenders}
              outstanding={outstanding}
              onTendersChange={setTenders}
              onOutstandingChange={setOutstanding}
            />
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                disabled={
                  submitting || Boolean(chargeError || discountError || postError || createdId)
                }
                onClick={() => void form.handleSubmit((values) => save(values, true))()}
              >
                {submitting
                  ? 'Posting…'
                  : tenders.length > 0
                    ? 'Post Invoice & Receipt'
                    : 'Finalize Invoice'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={
                  submitting || Boolean(chargeError || discountError || editError || createdId)
                }
                onClick={() => void form.handleSubmit((values) => save(values, false))()}
              >
                <Save className="size-4" /> Save Draft
              </Button>
              {postError ? <p className="text-muted-foreground text-xs">{postError}</p> : null}
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
