import { CSSProperties, ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { demoPagesEnabled } from '@/lib/demo-pages';
import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { tenantRepository } from '@/app/api/lib/modules/tenant/repository/tenant-repository';
import { AppPageHeader } from '@/components/app/app-page-header';
import { AppShellGate } from '@/components/app/app-shell-gate';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppTopbar } from '@/components/app/app-topbar';
import { TabSessionGate } from '@/components/app/tab-session-gate';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [cookieStore, session] = await Promise.all([cookies(), getSession()]);

  if (!session) {
    redirect('/login');
  }

  const tenantId = session.session.activeOrganizationId;

  if (tenantId) {
    const tenant = await tenantRepository.getTenantById(tenantId);

    if (tenant && !tenant.isOnboarded) {
      redirect('/onboarding');
    }
  }

  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  const appointmentsOnly = process.env.SIDEBAR_APPOINTMENTS_ONLY !== 'false';
  const showVisits = process.env.SIDEBAR_SHOW_VISITS === 'true';

  return (
    <TabSessionGate>
      <AppShellGate>
        <TooltipProvider>
          <SidebarProvider
            defaultOpen={defaultOpen}
            style={{ '--sidebar-width': '16.5rem' } as CSSProperties}
          >
            <AppSidebar
              appointmentsOnly={appointmentsOnly}
              showVisits={showVisits}
              showDemoPages={demoPagesEnabled()}
            />
            <SidebarInset>
              <AppTopbar />
              <AppPageHeader />
              <div className="flex min-w-0 flex-1 flex-col px-4 pt-4 pb-10 sm:px-6 lg:px-8">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </AppShellGate>
    </TabSessionGate>
  );
}
