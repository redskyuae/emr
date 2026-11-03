'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OUTREACH_STAFF } from '../../../../_utils/activity-options';
import { formatLongDate, toIsoDate } from '../../../../_utils/outreach-dates';
import type { OutreachAction } from '../../../../_utils/outreach-ledger';
import { staffName } from '../../../../_utils/outreach-presentation';
import type { OutreachContact } from '../../../../_utils/outreach-types';

type ReassignFormProps = {
  onDone: () => void;
  contact: OutreachContact;
  dispatch: (action: OutreachAction) => void;
};

export function ReassignForm({ contact, dispatch, onDone }: ReassignFormProps) {
  const [staffId, setStaffId] = useState(contact.staffId);

  return (
    <div className="space-y-4">
      <Field className="md:max-w-sm">
        <FieldLabel htmlFor="reassign-staff">Assigned staff</FieldLabel>
        <Select value={staffId} onValueChange={setStaffId}>
          <SelectTrigger id="reassign-staff" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OUTREACH_STAFF.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name} · {person.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-end">
        <Button
          size="lg"
          disabled={staffId === contact.staffId}
          onClick={() => {
            dispatch({
              type: 'contact/reassigned',
              id: contact.id,
              staffId,
              entry: {
                id: `${contact.id}-h${contact.history.length + 1}`,
                kind: 'fu',
                by: 'You',
                title: 'Reassigned',
                note: `Reassigned from ${staffName(contact.staffId)} to ${staffName(staffId)}.`,
                date: formatLongDate(toIsoDate(new Date())),
              },
            });
            toast.success(`Reassigned to ${staffName(staffId)}.`);
            onDone();
          }}
        >
          Reassign
        </Button>
        <Button size="lg" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
