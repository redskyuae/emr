import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { APPROVERS } from '../_data/counter-seed';
import { DISCOUNT_APPROVAL_THRESHOLD_PERCENT } from '../_utils/invoice-calc';
import { CounterField } from './counter-field';

export function DiscountApproval({
  largestPercent,
  reason,
  approvedBy,
  onReasonChange,
  onApprovedByChange,
}: {
  largestPercent: number;
  reason: string;
  approvedBy: string;
  onReasonChange: (value: string) => void;
  onApprovedByChange: (value: string) => void;
}) {
  const needsApproval = largestPercent > DISCOUNT_APPROVAL_THRESHOLD_PERCENT;

  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">Discount authorization</p>
      <div className="grid gap-3 md:grid-cols-2">
        <CounterField label="Reason for discount" htmlFor="discount-reason" required>
          <Input
            id="discount-reason"
            aria-required="true"
            placeholder="e.g. staff referral, package rate"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </CounterField>
        {needsApproval ? (
          <CounterField
            label="Approved by"
            htmlFor="discount-approver"
            required
            hint={`Discounts above ${DISCOUNT_APPROVAL_THRESHOLD_PERCENT}% need supervisor approval.`}
          >
            <NativeSelect
              id="discount-approver"
              className="w-full"
              aria-required="true"
              value={approvedBy}
              onChange={(event) => onApprovedByChange(event.target.value)}
            >
              <option value="">Select…</option>
              {APPROVERS.map((approver) => (
                <option key={approver} value={approver}>
                  {approver}
                </option>
              ))}
            </NativeSelect>
          </CounterField>
        ) : null}
      </div>
    </div>
  );
}

export function InsurerAuthorization({
  insurer,
  authNumber,
  onAuthNumberChange,
}: {
  insurer: string;
  authNumber: string;
  onAuthNumberChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">Insurer authorization · {insurer}</p>
      <CounterField
        label="Approval number"
        htmlFor="payer-auth"
        required
        hint="Required to submit the claim for the lines billed to the insurer."
      >
        <Input
          id="payer-auth"
          aria-required="true"
          value={authNumber}
          onChange={(event) => onAuthNumberChange(event.target.value)}
        />
      </CounterField>
    </div>
  );
}
