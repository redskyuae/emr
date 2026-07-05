import { redirect } from 'next/navigation';

import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import { OnboardingPageImpl } from '@/app/onboarding/_components/onboarding-page-impl';
import { Logo } from '@/components/brand/logo';

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const tenantId = session.session.activeOrganizationId;

  if (!tenantId) {
    redirect('/login');
  }

  const tenant = await tenantRepository.getTenantById(tenantId);

  if (!tenant) {
    redirect('/login');
  }

  if (tenant.isOnboarded) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <div className="flex items-center p-6">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <OnboardingPageImpl tenantName={tenant.name} />
        </div>
      </div>
    </div>
  );
}
