import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppTopbar } from '@/components/app/app-topbar';
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

  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <AppTopbar />
          <div className="flex flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6 lg:py-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
