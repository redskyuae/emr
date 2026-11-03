'use client';

import { useRouter } from 'next/navigation';

import { ContactForm } from '../../../../_components/contact-form';
import { ContactSummaryAside } from '../../../../_components/contact-summary-aside';
import {
  FormPageLayout,
  OutreachBreadcrumb,
  OutreachNotFound,
} from '../../../../_components/outreach-page-shell';
import { useOutreach } from '../../../../_components/outreach-store';

export function EditContactPageImpl({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { state, dispatch } = useOutreach();
  const contact = state.contacts.find((item) => item.id === contactId);
  const back = `/community-outreach?tab=contacts&selected=${contactId}`;

  return (
    <div className="space-y-4">
      <OutreachBreadcrumb current="Edit contact" tab="contacts" />
      {contact ? (
        <FormPageLayout
          title="Edit contact"
          description={`Update the details recorded for ${contact.name}.`}
          aside={<ContactSummaryAside contact={contact} activities={state.activities} />}
        >
          <ContactForm
            wide
            mode="edit"
            state={state}
            contact={contact}
            dispatch={dispatch}
            onSaved={() => router.push(back)}
            onCancel={() => router.push(back)}
          />
        </FormPageLayout>
      ) : (
        <OutreachNotFound entity="Contact" tab="contacts" />
      )}
    </div>
  );
}
