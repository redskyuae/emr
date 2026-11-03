'use client';

import { useRouter } from 'next/navigation';

import { ContactSummaryAside } from '../../../../_components/contact-summary-aside';
import {
  FormPageLayout,
  OutreachBreadcrumb,
  OutreachNotFound,
} from '../../../../_components/outreach-page-shell';
import { useOutreach } from '../../../../_components/outreach-store';
import { FollowUpForm } from './follow-up-form';

export function FollowUpPageImpl({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { state, dispatch } = useOutreach();
  const contact = state.contacts.find((item) => item.id === contactId);

  return (
    <div className="space-y-4">
      <OutreachBreadcrumb current="Log follow-up" tab="contacts" />
      {contact ? (
        <FormPageLayout
          title="Log follow-up"
          description={`Record the call or message with ${contact.name}.`}
          aside={<ContactSummaryAside contact={contact} activities={state.activities} />}
        >
          <FollowUpForm
            key={contact.id}
            contact={contact}
            dispatch={dispatch}
            onDone={() => router.push(`/community-outreach?tab=contacts&selected=${contact.id}`)}
          />
        </FormPageLayout>
      ) : (
        <OutreachNotFound entity="Contact" tab="contacts" />
      )}
    </div>
  );
}
