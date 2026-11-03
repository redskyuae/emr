'use client';

import { useRouter } from 'next/navigation';

import { ContactSummaryAside } from '../../../../_components/contact-summary-aside';
import {
  FormPageLayout,
  OutreachBreadcrumb,
  OutreachNotFound,
} from '../../../../_components/outreach-page-shell';
import { useOutreach } from '../../../../_components/outreach-store';
import { ReassignForm } from './reassign-form';

export function ReassignPageImpl({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { state, dispatch } = useOutreach();
  const contact = state.contacts.find((item) => item.id === contactId);

  return (
    <div className="space-y-4">
      <OutreachBreadcrumb current="Reassign contact" tab="contacts" />
      {contact ? (
        <FormPageLayout
          title="Reassign contact"
          description={`Choose who follows up with ${contact.name}.`}
          aside={<ContactSummaryAside contact={contact} activities={state.activities} />}
        >
          <ReassignForm
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
