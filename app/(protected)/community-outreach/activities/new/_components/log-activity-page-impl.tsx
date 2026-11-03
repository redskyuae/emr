'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useOutreach } from '../../../_components/outreach-store';
import { activityFormSchema, type ActivityFormValues } from '../../../_utils/activity-form-schema';
import { ACTIVITY_COPY, defaultActivityValues } from '../../../_utils/activity-options';
import { buildActivity, nextId } from '../../../_utils/outreach-ledger';
import { CompletionSection } from './completion-section';
import { LoggingStepsAside } from './logging-steps-aside';
import { OfferSection } from './offer-section';
import { StaffSection } from './staff-section';
import { TypeSection } from './type-section';
import { WhenSection } from './when-section';
import { WhereSection } from './where-section';

export function LogActivityPageImpl() {
  const router = useRouter();
  const { state, dispatch } = useOutreach();
  const form = useForm<ActivityFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(activityFormSchema),
    defaultValues: defaultActivityValues('camp'),
  });
  const status = useWatch({ control: form.control, name: 'status' });
  const type = useWatch({ control: form.control, name: 'type' });

  function save(destination: 'activities' | 'contacts') {
    return form.handleSubmit((values) => {
      const id = nextId('a', state.activities);

      dispatch({ type: 'activity/added', activity: buildActivity(values, id) });
      toast.success(
        values.status === 'completed'
          ? 'Activity logged as completed.'
          : 'Activity saved as planned.',
        { description: values.title }
      );
      router.push(
        destination === 'contacts'
          ? `/community-outreach/contacts/new?activity=${id}`
          : '/community-outreach'
      );
    })();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/community-outreach">Community Outreach</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Log activity</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h2 className="text-xl font-semibold">{ACTIVITY_COPY[type].pageTitle}</h2>
        <p className="text-muted-foreground text-sm">
          Plan an activity ahead, or record one that already happened. Contacts are added to it
          afterwards.
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form noValidate onSubmit={(event) => event.preventDefault()} className="min-w-0 space-y-4">
          <TypeSection form={form} />
          <WhenSection form={form} />
          <WhereSection form={form} />
          <StaffSection form={form} />
          <OfferSection form={form} />
          <CompletionSection form={form} />

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link href="/community-outreach">Cancel</Link>
            </Button>
            <Button type="button" variant="outline" onClick={() => save('contacts')}>
              Save &amp; add contacts
            </Button>
            <Button type="button" onClick={() => save('activities')}>
              {status === 'completed' ? 'Save completed activity' : 'Save as planned'}
            </Button>
          </div>
        </form>

        <LoggingStepsAside completed={status === 'completed'} />
      </div>
    </div>
  );
}
